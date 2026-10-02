import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTickets } from '../features/tickets/api/ticketApi'
import type { Ticket, TicketFilters } from '../features/tickets/types/ticket.types'
import './analytics.css'

const filters: TicketFilters = { page: 1, page_size: 100, search: '', priority: '', category: '', issue_type: '', overdue_only: false, sort_by: 'due_date', sort_order: 'asc' }
const status = (ticket: Ticket) => ticket.current_status_name || 'Open'
const dateLabel = (value?: string | null) => value ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value)) : 'No due date'

async function loadAllTickets() {
  const first = await getTickets(filters)
  if (first.pagination.total_pages < 2) return first.data
  const pages = await Promise.all(Array.from({ length: first.pagination.total_pages - 1 }, (_, index) => getTickets({ ...filters, page: index + 2 })))
  return first.data.concat(...pages.map((page) => page.data))
}

type WorkTab = 'assigned' | 'created' | 'watching'

export function MyWorkPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [tab, setTab] = useState<WorkTab>('assigned')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => { void loadAllTickets().then(setTickets).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load your work.')).finally(() => setLoading(false)) }, [])
  const visible = useMemo(() => {
    if (tab === 'assigned') return tickets.filter((ticket) => ticket.assigned_agent)
    if (tab === 'watching') return tickets.filter((ticket) => ticket.labels.some((label) => /watch|follow/i.test(label)))
    // The API does not expose a creator field yet; recent tickets are the best available workspace proxy.
    return tickets.slice(0, 12)
  }, [tab, tickets])
  const upcoming = tickets.filter((ticket) => ticket.due_date && !ticket.is_overdue && !/done|closed|resolved/i.test(status(ticket))).sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime()).slice(0, 4)
  return <div className="page-content my-work-page">
    <section className="work-heading"><div><p className="eyebrow">Personal workspace</p><h1>My work</h1><p className="subtle">Stay focused on the issues that need your attention.</p></div><Link className="primary-button" to="/tickets/new">＋ Create ticket</Link></section>
    {error && <div className="analytics-panel">{error}</div>}
    <div className="work-tabs" role="tablist" aria-label="My work views">{(['assigned', 'created', 'watching'] as WorkTab[]).map((item) => <button type="button" role="tab" aria-selected={tab === item} className={`work-tab ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)} key={item}>{item[0].toUpperCase() + item.slice(1)} <span>({item === 'assigned' ? tickets.filter((ticket) => ticket.assigned_agent).length : item === 'watching' ? tickets.filter((ticket) => ticket.labels.some((label) => /watch|follow/i.test(label))).length : Math.min(tickets.length, 12)})</span></button>)}</div>
    <div className="work-layout"><section className="work-list">{loading ? <div className="work-empty">Loading your work...</div> : visible.length ? <table><thead><tr><th>Issue</th><th>Project</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead><tbody>{visible.map((ticket) => <tr key={ticket._id}><td><span className="work-code">{ticket.ticket_code}</span><strong>{ticket.title}</strong><small>{ticket.issue_type}</small></td><td>{ticket.project_key}</td><td><span className={`status-pill ${status(ticket).toLowerCase().replaceAll(' ', '-')}`}>{status(ticket)}</span></td><td><span className={`priority-pill ${ticket.priority}`}>{ticket.priority}</span></td><td className={ticket.is_overdue ? 'overdue-date' : ''}>{dateLabel(ticket.due_date)}</td></tr>)}</tbody></table> : <div className="work-empty">Nothing in this view yet.</div>}</section>
      <aside className="work-side"><section className="work-side-card"><h2>Upcoming deadlines</h2>{upcoming.length ? upcoming.map((ticket) => <Link className="deadline" to={`/tickets?project=${ticket.project_key}`} key={ticket._id}><strong>{ticket.ticket_code} · {ticket.title}</strong><span>Due {dateLabel(ticket.due_date)}</span></Link>) : <div className="work-empty">No upcoming deadlines.</div>}</section><section className="work-side-card"><h2>Quick actions</h2><div className="quick-actions"><Link to="/tickets/new">Create a ticket</Link><Link to="/tickets">Search all tickets</Link><Link to="/projects">Open a project</Link></div></section></aside>
    </div>
  </div>
}
