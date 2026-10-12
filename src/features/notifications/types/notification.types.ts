export const notificationEventTypes = [
  'ticket_created',
  'ticket_updated',
  'ticket_assigned',
  'ticket_deleted',
  'ticket_transitioned',
  'ticket_linked',
  'comment_created',
  'comment_updated',
  'comment_deleted',
  'comment_mentioned',
] as const

export type NotificationEventType = typeof notificationEventTypes[number]

export type Notification = {
  _id: string
  project_id?: string | null
  ticket_id: string
  comment_id?: string | null
  actor_id?: string | null
  user_id: string
  event_type: NotificationEventType | string
  created_at: string
  is_read: boolean
  read_at?: string | null
}

export type NotificationPagination = {
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export type NotificationListResponse = {
  data: Notification[]
  pagination: NotificationPagination
}

export type NotificationPreferences = {
  user_id: string
  project_id: string
  enabled: boolean
  disabled_event_types: string[]
  available_event_types: string[]
}

export type NotificationPreferencesUpdate = {
  enabled: boolean
  disabled_event_types: string[]
}
