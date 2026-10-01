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
  due_date?: string | null
  is_overdue?: boolean
}

export type TicketFilters = {
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
