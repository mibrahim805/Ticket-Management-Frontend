import { useCallback, useEffect, useState } from 'react'
import { getTickets } from '../api/ticketApi'
import type { Ticket, TicketFilters, TicketPagination } from '../types/ticket.types'

const emptyPagination: TicketPagination = { total: 0, page: 1, page_size: 10, total_pages: 0, has_next: false, has_prev: false }

export function useTickets(filters: TicketFilters) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try { const response = await getTickets(filters); setTickets(response.data); setPagination(response.pagination) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load tickets.') } finally { setIsLoading(false) }
  }, [filters])

  useEffect(() => { void reload() }, [reload])
  return { tickets, pagination, isLoading, error, reload }
}
