import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TicketTable } from '../components/TicketTable'
import { useTickets } from '../hooks/useTickets'
import type { TicketCategory, TicketFilters, TicketIssueType, TicketPriority } from '../types/ticket.types'
import './tickets.css'

const initialFilters: TicketFilters = { page: 1, page_size: 10, search: '', priority: '', category: '', issue_type: '', overdue_only: false, sort_by: 'created_at', sort_order: 'desc' }

export function TicketsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const { tickets, pagination, isLoading, error, reload } = useTickets(filters)
  const update = <K extends keyof TicketFilters>(field: K, value: TicketFilters[K]) => setFilters((current) => ({ ...current, [field]: value, ...(field !== 'page' && { page: 1 }) }))

  return <div className="page-content tickets-page">
    <section className="page-heading"><div><p className="eyebrow">Workspace</p><h1>Tickets</h1><p className="subtle">Search and manage tickets across your accessible projects.</p></div><Link className="primary-button" to="/tickets/new">＋ Create ticket</Link></section>
    <section className="ticket-filters panel">
      <div className="ticket-search"><span>⌕</span><input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Search by ticket key, title, or description" /></div>
      <div className="filter-row"><label>Priority<select value={filters.priority} onChange={(event) => update('priority', event.target.value as TicketPriority | '')}><option value="">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label>Category<select value={filters.category} onChange={(event) => update('category', event.target.value as TicketCategory | '')}><option value="">All categories</option><option value="bug">Bug</option><option value="feature_request">Feature request</option><option value="support">Support</option></select></label><label>Issue type<select value={filters.issue_type} onChange={(event) => update('issue_type', event.target.value as TicketIssueType | '')}><option value="">All types</option><option value="task">Task</option><option value="bug">Bug</option><option value="story">Story</option><option value="epic">Epic</option><option value="subtask">Subtask</option></select></label><label>Sort by<select value={filters.sort_by} onChange={(event) => update('sort_by', event.target.value as TicketFilters['sort_by'])}><option value="created_at">Created date</option><option value="priority">Priority</option><option value="due_date">Due date</option></select></label><label className="sort-direction"><span>Order</span><button type="button" className="order-button" onClick={() => update('sort_order', filters.sort_order === 'desc' ? 'asc' : 'desc')}>{filters.sort_order === 'desc' ? 'Newest first ↓' : 'Oldest first ↑'}</button></label><label className="overdue-filter"><input type="checkbox" checked={filters.overdue_only} onChange={(event) => update('overdue_only', event.target.checked)} />Overdue only</label></div>
    </section>
    <div className="tickets-toolbar"><span>{isLoading ? 'Loading tickets...' : `${pagination.total} ${pagination.total === 1 ? 'ticket' : 'tickets'}`}</span><button className="refresh-button" onClick={() => void reload()} disabled={isLoading}>↻ Refresh</button></div>
    {error && <div className="inline-error"><span>{error}</span><button onClick={() => void reload()}>Try again</button></div>}
    {isLoading ? <div className="panel loading-state"><span className="spinner" />Loading tickets...</div> : <TicketTable tickets={tickets} />}
    {pagination.total_pages > 1 && <div className="pagination"><button disabled={!pagination.has_prev} onClick={() => update('page', filters.page - 1)}>← Previous</button><span>Page {pagination.page} of {pagination.total_pages}</span><button disabled={!pagination.has_next} onClick={() => update('page', filters.page + 1)}>Next →</button></div>}
  </div>
}
