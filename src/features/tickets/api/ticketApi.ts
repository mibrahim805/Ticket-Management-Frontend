import { apiClient } from '../../../services/apiClient'
import type { BulkTicketResult, CreateTicketRequest, CreatedTicket, EpicDetails, Ticket, TicketCapabilities, TicketDetails, TicketFilters, TicketLink, TicketLinkType, TicketPagination } from '../types/ticket.types'

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
  const endpoint = filters.project_key ? `/tickets/${encodeURIComponent(filters.project_key)}` : '/tickets/search'
  return apiClient<{ data: Ticket[]; pagination: TicketPagination }>(`${endpoint}?${params.toString()}`)
}

export type UpdateTicketRequest = Partial<Pick<Ticket, 'title' | 'description' | 'priority' | 'category' | 'labels' | 'components'>>

export function updateTicket(ticketId: string, request: UpdateTicketRequest) {
  return apiClient<{ message: string }>(`/update_ticket/${ticketId}`, { method: 'PUT', body: JSON.stringify(request) })
}

export function deleteTicket(ticketId: string) {
  return apiClient<{ message: string }>(`/tickets/${ticketId}`, { method: 'DELETE' })
}

export function assignTicket(ticketId: string, agentId: string) {
  return apiClient<{ message: string }>(`/tickets/${ticketId}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ agent_id: agentId }),
  })
}

export function getTicketDetails(ticketId: string) {
  return apiClient<TicketDetails>(`/tickets/detail?ticket_id=${encodeURIComponent(ticketId)}`)
}

export function getEpic(epicId: string) {
  return apiClient<EpicDetails>(`/epics/${encodeURIComponent(epicId)}`)
}

export function subscribeToTicket(ticketId: string) {
  return apiClient<{ message: string; watchers: string[] }>(`/tickets/${ticketId}/watchers/subscribe`, { method: 'POST' })
}

export function unsubscribeFromTicket(ticketId: string) {
  return apiClient<{ message: string; watchers: string[] }>(`/tickets/${ticketId}/watchers/unsubscribe`, { method: 'DELETE' })
}

export function getTicketCapabilities(ticketId: string) {
  return apiClient<TicketCapabilities>(`/tickets/${ticketId}/capabilities`)
}

export function createTicketLink(ticketId: string, toTicketId: string, linkType: TicketLinkType) {
  return apiClient<TicketLink>(`/tickets/${ticketId}/links`, { method: 'POST', body: JSON.stringify({ to_ticket_id: toTicketId, link_type: linkType }) })
}

export function getTicketLinks(ticketId: string) {
  return apiClient<{ links: TicketLink[] }>(`/tickets/${ticketId}/links`)
}

export function bulkAssignTickets(ticketIds: string[], agentId: string) {
  return apiClient<BulkTicketResult>('/tickets/bulk/assign', { method: 'POST', body: JSON.stringify({ ticket_ids: ticketIds, agent_id: agentId }) })
}

export function bulkTransitionTickets(ticketIds: string[], transitionId: string) {
  return apiClient<BulkTicketResult>('/tickets/bulk/transition', { method: 'POST', body: JSON.stringify({ ticket_ids: ticketIds, transition_id: transitionId }) })
}
