import { apiClient } from '../../../services/apiClient'
import type { SavedFilter, TicketFilters } from '../types/ticket.types'

export function listSavedFilters() {
  return apiClient<{ filters: SavedFilter[] }>('/filters')
}

export function createSavedFilter(name: string, queryParams: Partial<TicketFilters>) {
  return apiClient<SavedFilter>('/filters', {
    method: 'POST',
    body: JSON.stringify({ name: name.trim(), query_params: queryParams }),
  })
}

export function deleteSavedFilter(filterId: string) {
  return apiClient<{ message: string }>(`/filters/${filterId}`, { method: 'DELETE' })
}
