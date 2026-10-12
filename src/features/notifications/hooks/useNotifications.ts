import { createContext, useContext } from 'react'
import type { Notification } from '../types/notification.types'

export type NotificationsContextValue = {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('useNotifications must be used inside NotificationsProvider')
  return context
}
