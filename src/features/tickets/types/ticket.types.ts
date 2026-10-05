export type TicketIssueType = 'bug' | 'task' | 'story' | 'epic' | 'subtask'
export type TicketCategory = 'bug' | 'feature_request' | 'support'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export type CreateTicketRequest = {
  project_id: string
  title: string
  description: string
  category: TicketCategory
  issue_type: TicketIssueType
  epic_id?: string
  parent_id?: string
  labels: string[]
  components: string[]
  story_points?: number
  priority: TicketPriority
}

export type CreatedTicket = { _id: string; ticket_code: string; title: string }

export type Ticket = {
  _id: string
  ticket_code: string
  project_key: string
  title: string
  description: string
  current_status_name?: string
  current_status_id?: string
  priority: TicketPriority
  category: TicketCategory
  issue_type: TicketIssueType
  labels: string[]
  components: string[]
  assigned_agent?: string | null
  watchers?: string[]
  due_date?: string | null
  is_overdue?: boolean
}

export type TicketComment = { _id: string; ticket_id?: string; parent_id?: string | null; author_id?: string; message?: string; body?: string; content?: string; visibility?: 'public' | 'internal'; created_at?: string; updated_at?: string; author?: string; created_by?: string }
export type TicketDetails = { tickets: Ticket; comments: TicketComment[] }
export type TicketCapabilities = { ticket_id: string; project_id: string; role: string; capabilities: string[]; can: Record<string, boolean>; context: { is_creator: boolean; is_assignee: boolean; can_upload_attachments: boolean } }
export type TicketLinkType = 'blocks' | 'relates_to' | 'duplicates'
export type TicketLink = { _id: string; from_ticket_id: string; to_ticket_id: string; link_type: TicketLinkType }
export type BulkTicketResult = { succeeded: Array<{ ticket_id: string }>; failed: Array<{ ticket_id: string; status_code: number; detail: string }>; total: number }

export type TicketFilters = {
  project_key?: string
  page: number
  page_size: number
  search: string
  priority: TicketPriority | ''
  category: TicketCategory | ''
  issue_type: TicketIssueType | ''
  overdue_only: boolean
  sort_by: 'created_at' | 'priority' | 'due_date'
  sort_order: 'asc' | 'desc'
}

export type TicketPagination = { total: number; page: number; page_size: number; total_pages: number; has_next: boolean; has_prev: boolean }
