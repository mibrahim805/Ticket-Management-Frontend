import { appConfig } from '../../../app/config'
import { apiClient, ApiError } from '../../../services/apiClient'
import { storage } from '../../../services/storage'
import type { Notification, NotificationListResponse, NotificationPreferences, NotificationPreferencesUpdate } from '../types/notification.types'

export function getNotifications(options: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}) {
  const params = new URLSearchParams({
    page: String(options.page || 1),
    page_size: String(options.pageSize || 20),
  })
  if (options.unreadOnly) params.set('unread_only', 'true')
  return apiClient<NotificationListResponse>(`/notifications/?${params.toString()}`)
}

export function getNotification(notificationId: string) {
  return apiClient<Notification>(`/notifications/${encodeURIComponent(notificationId)}`)
}

export function markNotificationAsRead(notificationId: string) {
  return apiClient<{ message: string }>(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'PUT' })
}

export function markAllNotificationsAsRead() {
  return apiClient<{ message: string }>('/notifications/mark-all-read', { method: 'PUT' })
}

export function getNotificationPreferences(projectId: string) {
  return apiClient<NotificationPreferences>(`/notifications/preferences/${encodeURIComponent(projectId)}`)
}

export function updateNotificationPreferences(projectId: string, preferences: NotificationPreferencesUpdate) {
  return apiClient<NotificationPreferences>(`/notifications/preferences/${encodeURIComponent(projectId)}`, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  })
}

type NotificationStreamOptions = {
  signal: AbortSignal
  lastEventId?: string
  onNotification: (notification: Notification, eventId?: string) => void
}

async function streamError(response: Response) {
  const body = await response.json().catch(() => null)
  const detail = body?.detail
  return new ApiError(response.status, typeof detail === 'string' ? detail : `Notification stream failed with status ${response.status}.`)
}

/** Read the authenticated SSE stream. Fetch is used because EventSource cannot send Bearer headers. */
export async function streamNotifications({ signal, lastEventId, onNotification }: NotificationStreamOptions) {
  const token = storage.getToken()
  const headers = new Headers({ Accept: 'text/event-stream' })
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (lastEventId) headers.set('Last-Event-ID', lastEventId)

  const response = await fetch(`${appConfig.apiUrl}/notifications/stream`, { headers, signal })
  if (!response.ok) throw await streamError(response)
  if (!response.body) throw new Error('Notification stream returned no response body.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const consumeEvent = (rawEvent: string) => {
    let eventId: string | undefined
    let eventName = ''
    const data: string[] = []
    rawEvent.split(/\r?\n/).forEach((line) => {
      if (line.startsWith('id:')) eventId = line.slice(3).trim()
      else if (line.startsWith('event:')) eventName = line.slice(6).trim()
      else if (line.startsWith('data:')) data.push(line.slice(5).trim())
    })
    if (eventName !== 'notification' || data.length === 0) return
    try {
      onNotification(JSON.parse(data.join('\n')) as Notification, eventId)
    } catch {
      // Ignore malformed events and keep the connection alive.
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      const events = buffer.split(/\r?\n\r?\n/)
      buffer = events.pop() || ''
      events.forEach(consumeEvent)
      if (done) {
        if (buffer.trim()) consumeEvent(buffer)
        return
      }
    }
  } finally {
    reader.releaseLock()
  }
}
