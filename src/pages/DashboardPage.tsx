import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardActivity } from '../features/activity/api/activityApi'
import type { ActivityPeriod, DashboardActivity } from '../features/activity/types/activity.types'
import { useAuth } from '../features/auth/hooks/useAuth'
import { getProjects } from '../features/projects/api/projectApi'
import type { Project } from '../features/projects/types/project.types'
import { getTickets } from '../features/tickets/api/ticketApi'
import type { Ticket } from '../features/tickets/types/ticket.types'
import { Icon, type IconName } from '../components/ui/Icon'
import { apiClient } from '../services/apiClient'
import { storage } from '../services/storage'
import './dashboard.css'

type TicketSummary = { total_tickets?: number; open_tickets?: number; closed_tickets?: number }
type DashboardData = {
  summary: TicketSummary
  projects: Project[]
  dueThisWeek: number
  completed: number
  tickets: Ticket[]
  statusCounts: Record<string, number>
  activities: DashboardActivity[]
}

const chartColors = ['#aab8d5', '#3977ee', '#7853df', '#24b57a', '#f5a623', '#ef5f82']
const projectColors = ['blue', 'violet', 'green']
const dashboardDate = new Date()
const dashboardDateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(dashboardDate)

function initialActivityPeriod(): ActivityPeriod {
  const savedPeriod = storage.getDashboardActivityPeriod()
  return savedPeriod === 'month' || savedPeriod === 'all' || savedPeriod === 'week' ? savedPeriod : 'week'
}

function isCompleted(ticket: Ticket) {
  const status = (ticket.current_status_name || '').toLowerCase()
  return status.includes('done') || status.includes('closed') || status.includes('resolved')
}

function isInProgress(ticket: Ticket) {
  const status = (ticket.current_status_name || '').toLowerCase()
  return status.includes('progress') || status.includes('development') || status.includes('review')
}

function countDueThisWeek(tickets: Ticket[]) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 7)
  return tickets.filter((ticket) => {
    if (!ticket.due_date || isCompleted(ticket)) return false
    const due = new Date(ticket.due_date)
    return due >= start && due < end
  }).length
}

function greeting() {
  const hour = dashboardDate.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function titleCase(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function relativeTime(value?: string) {
  if (!value) return 'Recently'
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return 'Recently'
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60000))
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return days < 8 ? `${days}d ago` : new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function dueLabel(value: string) {
  const due = new Date(value)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (sameDay(due, today)) return 'Today'
  if (sameDay(due, tomorrow)) return 'Tomorrow'
  return due.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function statusClass(status?: string) {
  const value = (status || 'To Do').toLowerCase()
  if (value.includes('done') || value.includes('closed') || value.includes('resolved')) return 'done'
  if (value.includes('progress')) return 'progress'
  if (value.includes('development') || value.includes('review')) return 'development'
  return 'todo'
}

function actionCopy(activity: DashboardActivity) {
  const action = activity.action.toLowerCase()
  if (action.includes('transition')) return <><strong>{activity.actor_name}</strong> moved <b>{activity.ticket_code}</b></>
  if (action.includes('comment')) return <><strong>{activity.actor_name}</strong> commented on <b>{activity.ticket_code}</b></>
  if (action.includes('create')) return <><strong>{activity.actor_name}</strong> created <b>{activity.ticket_code}</b></>
  if (action.includes('close') || action.includes('resolve')) return <><strong>{activity.actor_name}</strong> closed <b>{activity.ticket_code}</b></>
  return <><strong>{activity.actor_name}</strong> updated <b>{activity.ticket_code}</b></>
}

function activityIcon(activity: DashboardActivity, index: number): IconName {
  const action = activity.action.toLowerCase()
  if (action.includes('comment')) return 'tickets'
  if (action.includes('create')) return 'plus'
  if (action.includes('close') || action.includes('resolve')) return 'check'
  if (action.includes('update')) return 'edit'
  return index === 0 ? 'activity' : 'arrow-right'
}

async function getAllTickets() {
  const filters = { project_key: '', page: 1, page_size: 100, search: '', priority: '' as const, category: '' as const, issue_type: '' as const, overdue_only: false, sort_by: 'created_at' as const, sort_order: 'desc' as const }
  const firstPage = await getTickets(filters)
  if (firstPage.pagination.total_pages <= 1) return firstPage.data
  const rest = await Promise.all(Array.from({ length: firstPage.pagination.total_pages - 1 }, (_, index) => getTickets({ ...filters, page: index + 2 })))
  return [firstPage.data, ...rest.map((page) => page.data)].flat()
}

function Sparkline({ color, variant = 0 }: { color: string; variant?: number }) {
  const paths = ['M1 29 C9 4 17 11 24 19 S39 23 47 10 S62 25 73 8', 'M1 27 C12 26 14 13 27 15 S44 28 55 24 S65 17 73 18', 'M1 28 C13 29 17 2 30 7 S47 31 59 26 S67 7 73 12', 'M1 29 C13 8 23 12 35 19 S53 25 60 11 S68 9 73 3']
  return <svg className="stat-sparkline" viewBox="0 0 74 34" preserveAspectRatio="none"><defs><linearGradient id={`spark-${color.replace('#', '')}-${variant}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".2" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs><path d={`${paths[variant]} L73 34 L1 34Z`} fill={`url(#spark-${color.replace('#', '')}-${variant})`} /><path d={paths[variant]} fill="none" stroke={color} strokeWidth="1.5" /></svg>
}

export function DashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activityPeriod, setActivityPeriod] = useState<ActivityPeriod>(initialActivityPeriod)
  const [projectFilter, setProjectFilter] = useState('')

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [summary, projectResponse, tickets, activity] = await Promise.all([
        apiClient<TicketSummary>('/tickets_summary'),
        getProjects(),
        getAllTickets(),
        getDashboardActivity(activityPeriod).catch(() => ({ status_counts: {}, activities: [] })),
      ])
      const total = summary.total_tickets || tickets.length
      const open = summary.open_tickets ?? tickets.filter((ticket) => !isCompleted(ticket)).length
      setDashboard({ summary, projects: projectResponse.projects, dueThisWeek: countDueThisWeek(tickets), completed: Math.max(total - open, 0), tickets, statusCounts: activity.status_counts, activities: activity.activities })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard data.')
    } finally {
      setIsLoading(false)
    }
  }, [activityPeriod])

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadDashboard(), 0)
    return () => window.clearTimeout(timeout)
  }, [loadDashboard])

  function changeActivityPeriod(period: ActivityPeriod) {
    storage.setDashboardActivityPeriod(period)
    setActivityPeriod(period)
  }

  const visibleTickets = useMemo(() => (dashboard?.tickets || []).filter((ticket) => !projectFilter || ticket.project_key === projectFilter).slice(0, 5), [dashboard?.tickets, projectFilter])
  const currentProjects = dashboard?.projects.slice(0, 3) || []
  const upcomingDeadlines = useMemo(() => (dashboard?.tickets || []).filter((ticket) => ticket.due_date && !isCompleted(ticket)).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()).slice(0, 4), [dashboard?.tickets])
  const statusEntries = Object.entries(dashboard?.statusCounts || {}).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const activityTotal = statusEntries.reduce((total, [, count]) => total + count, 0)
  let position = 0
  const donutParts = statusEntries.map(([, count], index) => {
    const from = position
    position += activityTotal ? count / activityTotal * 100 : 0
    return `${chartColors[index]} ${from}% ${position}%`
  })
  const donutStyle = { '--donut-gradient': activityTotal ? `conic-gradient(${donutParts.join(', ')})` : '#e8edf5' } as CSSProperties
  const displayName = user?.username || user?.email?.split('@')[0] || 'there'
  const roleName = user?.role === 'super_admin' ? 'Super Admin' : displayName

  return <div className="dashboard-page">
    <section className="dashboard-hero">
      <div className="dashboard-greeting">
        <time>{dashboardDateLabel}</time>
        <h1>{greeting()}, {roleName}<span aria-hidden="true">👋</span></h1>
        <p>Here's what's happening in your workspace today.</p>
      </div>
      <blockquote><span>“</span><p>Good project management<br />turns ideas into impact.”</p></blockquote>
      <div className="hero-landscape" aria-hidden="true"><i /><i /><i /><b /></div>
    </section>

    {error && <div className="dashboard-error" role="alert"><span>{error}</span><button type="button" onClick={() => void loadDashboard()}>Try again</button></div>}

    <div className="dashboard-layout">
      <main className="dashboard-main">
        <section className="stats-grid" aria-label="Workspace summary">
          <Link to="/tickets" className="stat-card stat-blue"><span className="stat-icon"><Icon name="tickets" /></span><span className="stat-copy"><small>Open tickets</small><strong>{isLoading ? '—' : dashboard?.summary.open_tickets ?? dashboard?.tickets.filter((ticket) => !isCompleted(ticket)).length ?? 0}</strong><em><Icon name="arrow-up" /> Active workspace</em></span><Sparkline color="#3478f6" /></Link>
          <Link to="/tickets" className="stat-card stat-amber"><span className="stat-icon"><Icon name="sprints" /></span><span className="stat-copy"><small>Due this week</small><strong>{isLoading ? '—' : dashboard?.dueThisWeek || 0}</strong><em className="down"><Icon name="arrow-down" /> Next 7 days</em></span><Sparkline color="#f6a51c" variant={1} /></Link>
          <Link to="/tickets" className="stat-card stat-green"><span className="stat-icon"><Icon name="check" /></span><span className="stat-copy"><small>Completed</small><strong>{isLoading ? '—' : dashboard?.completed || 0}</strong><em><Icon name="arrow-up" /> All time</em></span><Sparkline color="#19ad72" variant={2} /></Link>
          <Link to="/projects" className="stat-card stat-pink"><span className="stat-icon"><Icon name="layers" /></span><span className="stat-copy"><small>Active projects</small><strong>{isLoading ? '—' : dashboard?.projects.length || 0}</strong><em><Icon name="arrow-up" /> In workspace</em></span><Sparkline color="#f04f81" variant={3} /></Link>
        </section>

        <section className="dashboard-panel recent-tickets-panel">
          <div className="panel-heading"><div><h2>Recent tickets</h2><p>Latest activity from your projects</p></div><div className="panel-actions"><label><span className="sr-only">Filter by project</span><select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">All projects</option>{dashboard?.projects.map((project) => <option value={project.code} key={project._id}>{project.name}</option>)}</select></label><Link to="/tickets">View all tickets <Icon name="arrow-right" /></Link></div></div>
          <div className="ticket-table" role="table" aria-label="Recent tickets">
            <div className="ticket-table-head" role="row"><span>ID</span><span>Title</span><span>Project</span><span>Type</span><span>Priority</span><span>Status</span><span>Assignee</span><span>Updated</span><span /></div>
            {isLoading ? <div className="dashboard-empty">Loading recent tickets...</div> : visibleTickets.length ? visibleTickets.map((ticket, index) => <Link className="ticket-table-row" to={`/tickets/${ticket._id}`} role="row" key={ticket._id}>
              <span className="ticket-id"><i className={`ticket-mark mark-${index % 3}`}>×</i>{ticket.ticket_code}</span>
              <strong title={ticket.title}>{ticket.title}</strong>
              <span className="project-cell"><i className={`mini-project-mark ${projectColors[index % 3]}`}>{ticket.project_key.slice(0, 2)}</i>{dashboard?.projects.find((project) => project.code === ticket.project_key)?.name || ticket.project_key}</span>
              <span className="type-cell"><Icon name={ticket.issue_type === 'bug' ? 'bug' : 'task'} />{titleCase(ticket.issue_type || 'task')}</span>
              <span><i className={`priority-badge ${ticket.priority}`}>{titleCase(ticket.priority)}</i></span>
              <span><i className={`status-badge ${statusClass(ticket.current_status_name)}`}>● {ticket.current_status_name || 'To Do'}</i></span>
              <span className="assignee-cell"><i>{(ticket.assigned_agent || ticket.assigned_to || 'U').slice(0, 2).toUpperCase()}</i><span>{ticket.assigned_agent || ticket.assigned_to ? 'Assigned' : 'Unassigned'}</span></span>
              <time>{relativeTime(ticket.updated_at || ticket.last_updated || ticket.created_at || ticket.created_date)}</time>
              <span className="row-menu">•••</span>
            </Link>) : <div className="dashboard-empty">No tickets found for this project.</div>}
          </div>
        </section>

        <section className="dashboard-panel current-projects-panel">
          <div className="panel-heading"><div><h2>Current projects</h2><p>Quick overview of your active projects</p></div><Link to="/projects">View all projects <Icon name="arrow-right" /></Link></div>
          <div className="project-card-grid">
            {currentProjects.map((project, index) => {
              const tickets = dashboard?.tickets.filter((ticket) => ticket.project_key === project.code) || []
              const done = tickets.filter(isCompleted).length
              const progress = tickets.filter(isInProgress).length
              const todo = Math.max(tickets.length - done - progress, 0)
              const percentage = tickets.length ? Math.round(done / tickets.length * 100) : 0
              return <Link className="project-summary-card" to={`/projects/${project._id}`} key={project._id}>
                <header><span className={`project-logo ${projectColors[index]}`}>{project.code.slice(0, 2)}</span><span><strong>{project.name}</strong><small>{project.code} project</small></span><b>⋮</b></header>
                <div className="project-progress"><span style={{ width: `${percentage}%` }} /></div>
                <div className="project-meta"><span>{done}/{tickets.length || project.total_tickets || 0} tickets</span><span>{percentage}% complete</span></div>
                <footer><span><i>◉</i>{todo} To Do</span><span><i>↗</i>{progress} In Progress</span><span><i>✓</i>{done} Done</span></footer>
              </Link>
            })}
            {!isLoading && !currentProjects.length && <div className="dashboard-empty project-empty">No active projects yet.</div>}
          </div>
        </section>
      </main>

      <aside className="dashboard-side">
        <section className="dashboard-panel status-panel">
          <div className="side-heading"><h2>Ticket status</h2><select value={activityPeriod} onChange={(event) => changeActivityPeriod(event.target.value as ActivityPeriod)} aria-label="Ticket status period"><option value="week">This week</option><option value="month">This month</option><option value="all">All time</option></select></div>
          <div className="status-content"><div className="status-donut" style={donutStyle}><span><strong>{activityTotal}</strong><small>Total</small></span></div><div className="status-legend">{statusEntries.map(([name, count], index) => <div key={name}><i style={{ background: chartColors[index] }} /><span>{name}</span><strong>{count}</strong></div>)}{!statusEntries.length && <p>No ticket activity yet.</p>}</div></div>
        </section>

        <section className="dashboard-panel activity-panel">
          <div className="side-heading"><h2>Recent activity</h2><Link to="/tickets">View all <Icon name="arrow-right" /></Link></div>
          <div className="activity-list">{dashboard?.activities.slice(0, 5).map((activity, index) => <Link to={`/tickets?search=${encodeURIComponent(activity.ticket_code)}`} className={`activity-item activity-tone-${index % 5}`} key={activity.id}><span className="activity-symbol"><Icon name={activityIcon(activity, index)} /></span><span><span className="activity-copy">{actionCopy(activity)}</span><small>{activity.ticket_title}</small></span><time>{relativeTime(activity.changed_at)}</time></Link>)}{!isLoading && !dashboard?.activities.length && <div className="dashboard-empty side-empty">No activity for this period.</div>}</div>
        </section>

        <section className="dashboard-panel deadline-panel">
          <div className="side-heading"><h2>Upcoming deadlines</h2><Link to="/tickets">View all <Icon name="arrow-right" /></Link></div>
          <div className="deadline-list">{upcomingDeadlines.map((ticket, index) => <Link to={`/tickets/${ticket._id}`} className="deadline-item" key={ticket._id}><span><Icon name="calendar" /></span><strong>{ticket.ticket_code}</strong><p>{ticket.title}</p><time className={index === 0 ? 'urgent' : ''}>{dueLabel(ticket.due_date!)}</time></Link>)}{!isLoading && !upcomingDeadlines.length && <div className="dashboard-empty side-empty">No upcoming deadlines.</div>}</div>
        </section>
      </aside>
    </div>
  </div>
}
