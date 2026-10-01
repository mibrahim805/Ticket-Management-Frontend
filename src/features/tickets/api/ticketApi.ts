import { apiClient } from '../../../services/apiClient'
import type { CreateTicketRequest, CreatedTicket, Ticket, TicketFilters, TicketPagination } from '../types/ticket.types'

export function createTicket(request: CreateTicketRequest) {
  return apiClient<CreatedTicket>('/', { method: 'POST', body: JSON.stringify(request) })
}

export function getTickets(filters: TicketFilters) {
  const params = new URLSearchParams({ page: String(filters.page), page_size: String(filters.page_size), sort_by: filters.sort_by, sort_order: filters.sort_order })
  if (filters.search) params.set('search', filters.search)
  if (filters.priority) params.set('priority', filters.priority)
  if (filters.category) params.set('category', filters.category)
  if (filters.issue_type) params.set('issue_type', filters.issue_type)
  if (filters.overdue_only) params.set('overdue_only', 'true')
  return apiClient<{ data: Ticket[]; pagination: TicketPagination }>(`/tickets/search?${params.toString()}`)
}
