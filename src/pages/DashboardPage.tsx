import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjects } from '../features/projects/api/projectApi'
import { getTickets } from '../features/tickets/api/ticketApi'
import type { Ticket } from '../features/tickets/types/ticket.types'
import { getDashboardActivity } from '../features/activity/api/activityApi'
import type { ActivityPeriod, DashboardActivity } from '../features/activity/types/activity.types'
import { apiClient } from '../services/apiClient'
import './dashboard.css'

type TicketSummary = { total_tickets?: number; open_tickets?: number; closed_tickets?: number }
type DashboardData = { summary: TicketSummary; projects: number; dueThisWeek: number; completed: number; tickets: Ticket[]; statusCounts: Record<string, number>; activities: DashboardActivity[] }
type CurrentUser = { username: string }

function isCompleted(ticket: Ticket) {
  const status = (ticket.current_status_name || '').toLowerCase()
  return status.includes('done') || status.includes('closed') || status.includes('resolved')
}

function dueThisWeek(tickets: Ticket[]) {
  const today = new Date()
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  start.setDate(today.getDate() - today.getDay())
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return tickets.filter((ticket) => {
    if (!ticket.due_date || isCompleted(ticket)) return false
    const dueDate = new Date(ticket.due_date)
    return dueDate >= start && dueDate < end
  }).length
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

async function getAllTickets() {
  const firstPage = await getTickets({ project_key: '', page: 1, page_size: 100, search: '', priority: '', category: '', issue_type: '', overdue_only: false, sort_by: 'created_at', sort_order: 'desc' })
  if (firstPage.pagination.total_pages <= 1) return firstPage.data
  const remainingPages = await Promise.all(Array.from({ length: firstPage.pagination.total_pages - 1 }, (_, index) => getTickets({ project_key: '', page: index + 2, page_size: 100, search: '', priority: '', category: '', issue_type: '', overdue_only: false, sort_by: 'created_at', sort_order: 'desc' })))
  return [firstPage.data, ...remainingPages.map((page) => page.data)].flat()
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activityPeriod, setActivityPeriod] = useState<ActivityPeriod>('week')
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [summary, projects, tickets, activity, user] = await Promise.all([
        apiClient<TicketSummary>('/tickets_summary'),
        getProjects(),
        getAllTickets(),
        getDashboardActivity(activityPeriod).catch(() => ({ status_counts: {}, activities: [] })),
        apiClient<CurrentUser>('/me'),
      ])
      const totalTickets = summary.total_tickets || 0
      const openTickets = summary.open_tickets || 0
      setCurrentUser(user)
      setDashboard({ summary, projects: projects.projects.length, dueThisWeek: dueThisWeek(tickets), completed: Math.max(totalTickets - openTickets, 0), tickets, statusCounts: activity.status_counts, activities: activity.activities })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard data.')
    } finally { setIsLoading(false) }
  }, [activityPeriod])

  useEffect(() => { void loadDashboard() }, [loadDashboard])

  const recentTickets = dashboard?.tickets.slice(0, 5) ?? []
  const statusCounts = dashboard?.statusCounts || {}
  const activityEvents = dashboard?.activities || []
  const activityTotal = Object.values(statusCounts).reduce((total, count) => total + count, 0)
  const relativeTime = (value: string) => {
    const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000))
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.round(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.round(hours / 24)}d ago`
  }

  return <div className="page-content dashboard-page">
    <section className="dashboard-welcome"><div><p className="eyebrow">{getGreeting().toUpperCase()}, {(currentUser?.username || 'USER').toUpperCase()} <span>☀</span></p><h1>Here's what's happening in your workspace</h1><p className="subtle">Track your projects, tickets and team activity at a glance.</p></div></section>
    {error && <div className="dashboard-error"><span>{error}</span><button type="button" onClick={() => void loadDashboard()}>Try again</button></div>}
    <div className="dashboard-columns"><main>
      <section className="stats-grid">
        <article className="stat-card indigo-card"><div className="stat-icon indigo">▣</div><div><span>Open tickets</span><strong>{isLoading ? '—' : dashboard?.summary.open_tickets || 0}</strong><small>↗ 12% &nbsp; vs. last week</small></div><b>›</b></article>
        <article className="stat-card amber-card"><div className="stat-icon amber">◷</div><div><span>Due this week</span><strong>{isLoading ? '—' : dashboard?.dueThisWeek || 0}</strong><small>↗ 25% &nbsp; vs. last week</small></div><b>›</b></article>
        <article className="stat-card green-card"><div className="stat-icon green">✓</div><div><span>Completed</span><strong>{isLoading ? '—' : dashboard?.completed || 0}</strong><small>↗ 48% &nbsp; vs. last week</small></div><b>›</b></article>
        <article className="stat-card rose-card"><div className="stat-icon rose">♧</div><div><span>Active projects</span><strong>{isLoading ? '—' : dashboard?.projects || 0}</strong><small>of 7 total projects</small></div><b>›</b></article>
      </section>
      <section className="panel dashboard-recent"><div className="dashboard-section-heading"><div><h2>Recent tickets</h2><p>Latest ticket activity from your accessible projects.</p></div><Link to="/tickets">View all tickets →</Link></div>{isLoading ? <div className="dashboard-loading">Loading recent tickets...</div> : recentTickets.length ? <div className="dashboard-ticket-list">{recentTickets.map((ticket) => <Link className="dashboard-ticket-row" to={`/tickets?project=${ticket.project_key}`} key={ticket._id}><span className="ticket-code">{ticket.ticket_code}</span><strong>{ticket.title}</strong><span className="dashboard-project-pill">▣ {ticket.project_key}</span><span className={`priority-pill ${ticket.priority}`}>{ticket.priority}</span><span className="status-pill">{ticket.current_status_name || 'To Do'}</span><small>2h ago</small><b>•••</b></Link>)}</div> : <div className="dashboard-loading">No tickets found.</div>}</section>
      <section className="panel dashboard-projects"><div className="dashboard-section-heading"><div><h2>Current projects</h2><p>Quick overview of your active projects.</p></div><Link to="/projects">View all projects →</Link></div><div className="dashboard-project-grid">{(dashboard?.tickets.length ? Array.from(new Set(dashboard.tickets.map((ticket) => ticket.project_key))) : []).slice(0, 4).map((projectKey, index) => <Link className="dashboard-project-card" to={`/tickets?project=${projectKey}`} key={projectKey}><div><span className={`dashboard-project-icon project-color-${index}`}>{projectKey.slice(0, 2).toUpperCase()}</span><strong>{projectKey}</strong><small>{index % 2 ? 'Backend' : 'Frontend'}</small></div><b>⋮</b><div className="project-progress"><span style={{ width: `${67 - index * 15}%` }} /></div><footer><span>▢ {Math.max(0, (dashboard?.tickets.filter((ticket) => ticket.project_key === projectKey).length || 0))} issues</span><span>♧ {index + 2} members</span></footer></Link>)}</div></section>
    </main><aside className="dashboard-side"><div className="dashboard-date"><strong>▣ &nbsp; {new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}</strong><small>Today</small></div><section className="panel dashboard-status"><div className="dashboard-section-heading"><h2>Ticket status</h2><select value={activityPeriod} onChange={(event) => setActivityPeriod(event.target.value as ActivityPeriod)} aria-label="Ticket status period"><option value="week">This week</option><option value="month">This month</option><option value="all">All time</option></select></div><div className="dashboard-donut"><strong>{activityTotal}</strong><small>{activityPeriod === 'all' ? 'Total' : 'Period'}</small></div><div className="dashboard-legend">{Object.entries(statusCounts).map(([name, count], index) => <span key={name}><i className={`legend-dot dot-${index}`} />{name}<b>{count}</b><small>{activityTotal ? Math.round(count / activityTotal * 100) : 0}%</small></span>)}</div></section><section className="panel dashboard-activity"><div className="dashboard-section-heading"><h2>Recent activity</h2><Link to="/tickets">View all →</Link></div>{activityEvents.length ? activityEvents.slice(0, 5).map((activity, index) => <div className="activity-row" key={activity.id}><span className={`activity-icon activity-${index}`}>↗</span><div><strong>{activity.actor_name} {activity.action} {activity.ticket_code}</strong><p>{activity.ticket_title}</p><small>▣ {activity.project_key}</small></div><time>{relativeTime(activity.changed_at)}</time></div>) : <div className="dashboard-loading">No activity for this period.</div>}</section></aside></div>
  </div>
}
