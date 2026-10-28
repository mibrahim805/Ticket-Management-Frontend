import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { useAuth } from '../features/auth/hooks/useAuth'
import { getTickets } from '../features/tickets/api/ticketApi'
import { useCreateTicketDrawer } from '../features/tickets/components/createTicketDrawerContext'
import type { Ticket, TicketFilters } from '../features/tickets/types/ticket.types'
import './my-work.css'

const filters: TicketFilters = { page: 1, page_size: 100, search: '', priority: '', category: '', issue_type: '', overdue_only: false, sort_by: 'due_date', sort_order: 'asc' }
const workReferenceTime = Date.now()
const status = (ticket: Ticket) => ticket.current_status_name || 'To Do'
const isCompleted = (ticket: Ticket) => /done|closed|resolved/i.test(status(ticket))

function dateLabel(value?: string | null) {
  if (!value) return 'No due date'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'No due date' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}

function titleCase(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statusClass(value: string) {
  const normalized = value.toLowerCase()
  if (/done|closed|resolved/.test(normalized)) return 'done'
  if (/progress|development/.test(normalized)) return 'progress'
  if (/review|qa/.test(normalized)) return 'review'
  return 'todo'
}

async function loadAllTickets() {
  const first = await getTickets(filters)
  if (first.pagination.total_pages < 2) return first.data
  const pages = await Promise.all(Array.from({ length: first.pagination.total_pages - 1 }, (_, index) => getTickets({ ...filters, page: index + 2 })))
  return first.data.concat(...pages.map((page) => page.data))
}

type WorkTab = 'assigned' | 'created' | 'watching'

export function MyWorkPage() {
  const { user } = useAuth()
  const { openCreateTicket } = useCreateTicketDrawer()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [tab, setTab] = useState<WorkTab>('assigned')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    function refreshWork() {
      setLoading(true)
      void loadAllTickets().then((response) => {
        if (active) setTickets(response)
      }).catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load your work.')
      }).finally(() => {
        if (active) setLoading(false)
      })
    }
    refreshWork()
    window.addEventListener('ticket-created', refreshWork)
    return () => { active = false; window.removeEventListener('ticket-created', refreshWork) }
  }, [])

  const work = useMemo(() => {
    const assigned = tickets.filter((ticket) => user?.user_id ? ticket.assigned_agent === user.user_id || ticket.assigned_to === user.user_id : Boolean(ticket.assigned_agent || ticket.assigned_to))
    const created = tickets.filter((ticket) => user?.user_id ? ticket.created_by === user.user_id : true).slice(0, 12)
    const watching = tickets.filter((ticket) => user?.user_id ? ticket.watchers?.includes(user.user_id) : Boolean(ticket.watchers?.length))
    return { assigned, created, watching }
  }, [tickets, user])

  const visible = work[tab]
  const openAssigned = work.assigned.filter((ticket) => !isCompleted(ticket)).length
  const overdue = work.assigned.filter((ticket) => ticket.is_overdue && !isCompleted(ticket)).length
  const dueSoon = work.assigned.filter((ticket) => {
    if (!ticket.due_date || ticket.is_overdue || isCompleted(ticket)) return false
    const days = (new Date(ticket.due_date).getTime() - workReferenceTime) / 86400000
    return days >= 0 && days <= 7
  }).length
  const upcoming = tickets.filter((ticket) => ticket.due_date && !ticket.is_overdue && !isCompleted(ticket)).sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime()).slice(0, 4)

  const tabs: Array<{ id: WorkTab; label: string; count: number }> = [
    { id: 'assigned', label: 'Assigned to me', count: work.assigned.length },
    { id: 'created', label: 'Created by me', count: work.created.length },
    { id: 'watching', label: 'Watching', count: work.watching.length },
  ]

  return <div className="my-work-page">
    <header className="work-heading">
      <div><p className="work-eyebrow"><span><Icon name="work" /></span> Personal workspace</p><h1>My work</h1><p>Everything that needs your attention, organized in one place.</p></div>
      <button className="work-create-button" type="button" onClick={() => openCreateTicket()}><Icon name="plus" /> Create ticket</button>
    </header>

    {error && <div className="work-error" role="alert">{error}</div>}

    <section className="work-overview" aria-label="Work summary">
      <article><span className="work-metric-icon blue"><Icon name="tickets" /></span><div><small>Open assignments</small><strong>{openAssigned}</strong><p>Issues currently assigned to you</p></div></article>
      <article><span className="work-metric-icon amber"><Icon name="calendar" /></span><div><small>Due this week</small><strong>{dueSoon}</strong><p>Deadlines in the next 7 days</p></div></article>
      <article><span className="work-metric-icon rose"><Icon name="activity" /></span><div><small>Overdue</small><strong>{overdue}</strong><p>Issues requiring immediate action</p></div></article>
    </section>

    <div className="work-layout">
      <section className="work-list-card">
        <div className="work-list-toolbar">
          <div className="work-tabs" role="tablist" aria-label="My work views">{tabs.map((item) => <button type="button" role="tab" aria-selected={tab === item.id} className={`work-tab ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)} key={item.id}>{item.label}<span>{item.count}</span></button>)}</div>
          <span className="work-result-count">{visible.length} {visible.length === 1 ? 'issue' : 'issues'}</span>
        </div>

        <div className="work-table-wrap">
          {loading ? <div className="work-empty"><span><Icon name="work" /></span><strong>Loading your work...</strong></div> : visible.length ? <table>
            <thead><tr><th>Issue</th><th>Project</th><th>Status</th><th>Priority</th><th>Due date</th></tr></thead>
            <tbody>{visible.map((ticket) => <tr key={ticket._id}>
              <td><Link className="work-issue" to={`/tickets/${ticket._id}`}><span className={`work-type-icon ${ticket.issue_type === 'bug' ? 'bug' : ''}`}><Icon name={ticket.issue_type === 'bug' ? 'bug' : 'task'} /></span><span><span className="work-code">{ticket.ticket_code}</span><strong>{ticket.title}</strong><small>{titleCase(ticket.issue_type || 'task')}</small></span></Link></td>
              <td><span className="work-project"><i>{ticket.project_key.slice(0, 2)}</i>{ticket.project_key}</span></td>
              <td><span className={`work-status ${statusClass(status(ticket))}`}><i />{status(ticket)}</span></td>
              <td><span className={`work-priority ${ticket.priority}`}><i />{titleCase(ticket.priority)}</span></td>
              <td><span className={`work-due ${ticket.is_overdue ? 'overdue' : ''}`}><Icon name="calendar" />{dateLabel(ticket.due_date)}</span></td>
            </tr>)}</tbody>
          </table> : <div className="work-empty"><span><Icon name="check" /></span><strong>You're all caught up</strong><p>There are no issues in this view.</p></div>}
        </div>
      </section>

      <aside className="work-side">
        <section className="work-side-card deadline-card">
          <header><span><Icon name="calendar" /></span><div><h2>Upcoming deadlines</h2><p>Your nearest due dates</p></div></header>
          {upcoming.length ? <div className="work-deadline-list">{upcoming.map((ticket) => <Link className="work-deadline" to={`/tickets/${ticket._id}`} key={ticket._id}><span className="deadline-date"><strong>{new Date(ticket.due_date!).getDate()}</strong><small>{new Date(ticket.due_date!).toLocaleDateString([], { month: 'short' })}</small></span><span><strong>{ticket.title}</strong><small>{ticket.ticket_code} · {ticket.project_key}</small></span><Icon name="arrow-right" /></Link>)}</div> : <div className="work-side-empty"><span><Icon name="check" /></span><strong>No deadlines ahead</strong><p>Your schedule is clear.</p></div>}
        </section>

        <section className="work-side-card action-card">
          <header><span><Icon name="activity" /></span><div><h2>Quick actions</h2><p>Jump straight back into work</p></div></header>
          <div className="quick-actions">
            <button type="button" onClick={() => openCreateTicket()}><span className="action-icon violet"><Icon name="plus" /></span><span><strong>Create a ticket</strong><small>Capture a new issue</small></span><Icon name="arrow-right" /></button>
            <Link to="/tickets"><span className="action-icon blue"><Icon name="search" /></span><span><strong>Search tickets</strong><small>Find work across projects</small></span><Icon name="arrow-right" /></Link>
            <Link to="/projects"><span className="action-icon green"><Icon name="projects" /></span><span><strong>Open a project</strong><small>View boards and progress</small></span><Icon name="arrow-right" /></Link>
          </div>
        </section>
      </aside>
    </div>
  </div>
}
