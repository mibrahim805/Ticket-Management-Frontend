import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/hooks/useAuth'
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, streamNotifications } from './api/notificationApi'
import { NotificationsContext } from './hooks/useNotifications'
import type { Notification } from './types/notification.types'

function upsertNotification(current: Notification[], next: Notification) {
  return [next, ...current.filter((item) => item._id !== next._id)]
}

function waitForReconnect(signal: AbortSignal, delay: number) {
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, delay)
    signal.addEventListener('abort', () => {
      window.clearTimeout(timeout)
      resolve()
    }, { once: true })
  })
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setIsLoading(false)
      setError('')
      return
    }

    const controller = new AbortController()
    let isCurrent = true
    let lastEventId: string | undefined
    setIsLoading(true)
    setError('')

    async function connect() {
      try {
        const response = await getNotifications({ page: 1, pageSize: 20 })
        if (!isCurrent) return
        setNotifications(response.data)
        // The API sorts newest first, so this is the cursor for the initial page.
        lastEventId = response.data[0]?._id
      } catch (requestError) {
        if (isCurrent) setError(requestError instanceof Error ? requestError.message : 'Unable to load notifications.')
      } finally {
        if (isCurrent) setIsLoading(false)
      }

      while (!controller.signal.aborted) {
        try {
          await streamNotifications({
            signal: controller.signal,
            lastEventId,
            onNotification: (notification, eventId) => {
              if (eventId) lastEventId = eventId
              if (isCurrent) setNotifications((current) => upsertNotification(current, notification))
            },
          })
        } catch (streamRequestError) {
          if (!controller.signal.aborted && isCurrent) {
            setError(streamRequestError instanceof Error ? streamRequestError.message : 'Notification stream unavailable.')
          }
        }
        if (!controller.signal.aborted) await waitForReconnect(controller.signal, 1500)
      }
    }

    void connect()
    return () => {
      isCurrent = false
      controller.abort()
    }
  }, [isAuthenticated])

  const value = useMemo(() => ({
    notifications,
    unreadCount: notifications.filter((notification) => !notification.is_read).length,
    isLoading,
    error,
    markAsRead: async (notificationId: string) => {
      const previous = notifications
      setNotifications((current) => current.map((notification) => notification._id === notificationId ? { ...notification, is_read: true, read_at: new Date().toISOString() } : notification))
      try {
        await markNotificationAsRead(notificationId)
      } catch (requestError) {
        setNotifications(previous)
        throw requestError
      }
    },
    markAllAsRead: async () => {
      const previous = notifications
      setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true, read_at: notification.read_at || new Date().toISOString() })))
      try {
        await markAllNotificationsAsRead()
      } catch (requestError) {
        setNotifications(previous)
        throw requestError
      }
    },
  }), [error, isLoading, notifications])

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
