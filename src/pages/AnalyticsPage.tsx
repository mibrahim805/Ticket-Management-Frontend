import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjects } from '../features/projects/api/projectApi'
import type { Project } from '../features/projects/types/project.types'
import { getAgentTicketsReport, getMyDashboardReport, getOverdueTicketsReport, getProjectReportSummary, getProjectVelocityReport, getResolutionTimeReport } from '../features/reports/api/reportApi'
import type { AgentTicketsReport, MyDashboardReport, OverdueTicketsReport, ProjectReportSummary, ProjectVelocityReport, ResolutionTimeReport } from '../features/reports/api/reportApi'
import './analytics.css'

const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
const formatHours = (hours: number) => hours < 24 ? `${hours.toFixed(1)}h` : `${(hours / 24).toFixed(1)}d`
const errorMessage = (reason: unknown, fallback: string) => reason instanceof Error ? reason.message : fallback

function ReportTickets({ tickets, emptyMessage }: { tickets: MyDashboardReport['my_open_issues']; emptyMessage: string }) {
  return tickets.length ? <div className="report-ticket-list">{tickets.slice(0, 6).map((ticket) => <Link className="report-ticket-row" to={`/tickets/${ticket.ticket_id}`} key={ticket.ticket_id}><span className="work-code">{ticket.ticket_code}</span><strong>{ticket.title}</strong><span className={`priority-pill ${ticket.priority || ''}`}>{label(ticket.priority || 'unknown')}</span><span className={`status-pill ${ticket.is_overdue ? 'overdue-status' : ''}`}>{ticket.current_status_name || 'Open'}</span></Link>)}</div> : <div className="analytics-loading">{emptyMessage}</div>
}

function ProjectReport({ summary, velocity }: { summary: ProjectReportSummary; velocity: ProjectVelocityReport | null }) {
  const statusEntries = Object.entries(summary.by_status)
  const priorityEntries = Object.entries(summary.by_priority)
  const maxStatus = Math.max(...statusEntries.map(([, count]) => count), 1)
  return <>
    <section className="analytics-grid report-project-stats"><article className="analytics-card"><p>Total tickets</p><strong>{summary.total_tickets}</strong><small>{summary.assigned_tickets} assigned</small></article><article className="analytics-card"><p>Open tickets</p><strong>{summary.open_tickets}</strong><small>{summary.unassigned_tickets} unassigned</small></article><article className="analytics-card"><p>Overdue tickets</p><strong>{summary.overdue_tickets}</strong><small>Open work past due</small></article><article className="analytics-card"><p>Backlog</p><strong>{summary.agile.backlog_tickets}</strong><small>{summary.agile.backlog_story_points} story points</small></article></section>
    <div className="analytics-layout"><section className="analytics-panel"><h2>Status distribution</h2><p>Ticket counts grouped by workflow status.</p>{statusEntries.length ? statusEntries.map(([name, count]) => <div className="breakdown-row" key={name}><span>{label(name)}</span><div className="breakdown-track"><span style={{ width: `${count / maxStatus * 100}%` }} /></div><b>{count}</b></div>) : <div className="analytics-loading">No status data yet.</div>}</section><section className="analytics-panel"><h2>Priority distribution</h2><p>Ticket counts grouped by priority.</p>{priorityEntries.length ? priorityEntries.map(([name, count]) => <div className="ranking-row" key={name}><strong>{label(name)}</strong><span>{count} tickets</span></div>) : <div className="analytics-loading">No priority data yet.</div>}</section></div>
    <div className="analytics-bottom"><section className="analytics-panel"><h2>Sprint velocity</h2><p>Completed story points from recent completed sprints.</p>{velocity ? <><div className="velocity-summary"><div><span>Average</span><strong>{velocity.average_velocity}</strong></div><div><span>Latest</span><strong>{velocity.latest_velocity}</strong></div><div><span>Trend</span><strong className={`trend-${velocity.trend}`}>{velocity.trend === 'up' ? '↑' : velocity.trend === 'down' ? '↓' : '→'} {label(velocity.trend)}</strong></div></div>{velocity.sprints.length ? <div className="velocity-list">{velocity.sprints.map((sprint) => <div className="ranking-row" key={sprint.sprint_id}><strong>{sprint.name}</strong><span>{sprint.velocity} points · {sprint.completion_rate}%</span></div>)}</div> : <div className="analytics-loading">No completed sprints yet.</div>}</> : <div className="analytics-loading">Velocity is unavailable for this project.</div>}</section><section className="analytics-panel"><h2>Active sprint</h2><p>Current sprint commitment and completion.</p>{summary.agile.active_sprint ? <div className="active-sprint-report"><strong>{summary.agile.active_sprint.name}</strong><div className="sprint-progress"><span style={{ width: `${summary.agile.active_sprint.total_tickets ? summary.agile.active_sprint.completed_tickets / summary.agile.active_sprint.total_tickets * 100 : 0}%` }} /></div><span>{summary.agile.active_sprint.completed_tickets} of {summary.agile.active_sprint.total_tickets} tickets completed</span><small>{summary.agile.active_sprint.completed_story_points} of {summary.agile.active_sprint.committed_story_points} story points completed</small></div> : <div className="analytics-loading">No active sprint.</div>}</section></div>
  </>
}

export function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [dashboard, setDashboard] = useState<MyDashboardReport | null>(null)
  const [agentTickets, setAgentTickets] = useState<AgentTicketsReport | null>(null)
  const [overdueTickets, setOverdueTickets] = useState<OverdueTicketsReport | null>(null)
  const [resolutionTime, setResolutionTime] = useState<ResolutionTimeReport | null>(null)
  const [projectSummary, setProjectSummary] = useState<ProjectReportSummary | null>(null)
  const [projectVelocity, setProjectVelocity] = useState<ProjectVelocityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [projectLoading, setProjectLoading] = useState(false)
  const [error, setError] = useState('')
  const [projectError, setProjectError] = useState('')
  const [adminError, setAdminError] = useState('')

  useEffect(() => {
    let active = true
    void Promise.allSettled([getProjects(), getMyDashboardReport(), getAgentTicketsReport(), getOverdueTicketsReport(), getResolutionTimeReport()]).then(([projectsResult, dashboardResult, agentResult, overdueResult, resolutionResult]) => {
      if (!active) return
      if (projectsResult.status === 'fulfilled') {
        setProjects(projectsResult.value.projects)
        if (projectsResult.value.projects.length) setSelectedProjectId((current) => current || projectsResult.value.projects[0]._id)
      } else setError(errorMessage(projectsResult.reason, 'Unable to load projects for reporting.'))
      if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value)
      else setError(errorMessage(dashboardResult.reason, 'Unable to load your report dashboard.'))
      const adminFailures = [agentResult, overdueResult, resolutionResult].filter((result) => result.status === 'rejected')
      if (agentResult.status === 'fulfilled') setAgentTickets(agentResult.value)
      if (overdueResult.status === 'fulfilled') setOverdueTickets(overdueResult.value)
      if (resolutionResult.status === 'fulfilled') setResolutionTime(resolutionResult.value)
      if (adminFailures.length) setAdminError('Some administrator reports are unavailable for your account.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedProjectId) return
    let active = true
    setProjectLoading(true)
    setProjectError('')
    setProjectSummary(null)
    setProjectVelocity(null)
    void Promise.allSettled([getProjectReportSummary(selectedProjectId), getProjectVelocityReport(selectedProjectId)]).then(([summaryResult, velocityResult]) => {
      if (!active) return
      if (summaryResult.status === 'fulfilled') setProjectSummary(summaryResult.value)
      else setProjectError(errorMessage(summaryResult.reason, 'Unable to load the project summary.'))
      if (velocityResult.status === 'fulfilled') setProjectVelocity(velocityResult.value)
      else if (summaryResult.status === 'fulfilled') setProjectError(errorMessage(velocityResult.reason, 'Unable to load project velocity.'))
    }).finally(() => { if (active) setProjectLoading(false) })
    return () => { active = false }
  }, [selectedProjectId])

  return <div className="page-content analytics-page">
    <section className="analytics-heading"><div><p className="eyebrow">Workspace reports</p><h1>Reports</h1><p className="subtle">Live summaries for your work, projects, and team performance.</p></div><Link className="secondary-button" to="/tickets">Browse tickets →</Link></section>
    {error && <div className="analytics-panel report-error">{error}</div>}
    {loading ? <div className="analytics-loading">Loading reports...</div> : <>
      <section className="analytics-grid"><article className="analytics-card"><p>My open issues</p><strong>{dashboard?.counts.my_open_issues ?? '—'}</strong><small>Created by you</small></article><article className="analytics-card"><p>Assigned to me</p><strong>{dashboard?.counts.assigned_to_me ?? '—'}</strong><small>Active assigned work</small></article><article className="analytics-card"><p>Overdue tickets</p><strong>{overdueTickets?.total_overdue ?? '—'}</strong><small>{dashboard?.counts.overdue_assigned_to_me ?? 0} assigned to you</small></article><article className="analytics-card"><p>Average resolution</p><strong>{resolutionTime ? formatHours(resolutionTime.avg_resolution_hours) : '—'}</strong><small>{resolutionTime ? `${resolutionTime.total_resolved} resolved tickets` : 'Admin report'}</small></article></section>
      <div className="analytics-bottom"><section className="analytics-panel"><h2>My open issues</h2><p>Tickets you created that still need work.</p><ReportTickets tickets={dashboard?.my_open_issues || []} emptyMessage="You have no open issues." /></section><section className="analytics-panel"><h2>Assigned to me</h2><p>Active tickets currently assigned to you.</p><ReportTickets tickets={dashboard?.assigned_to_me || []} emptyMessage="No tickets are assigned to you." /></section></div>
      <section className="analytics-panel project-report-panel"><div className="report-panel-heading"><div><h2>Project reports</h2><p>Summary and velocity for a project you can access.</p></div><label>Project<select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)} disabled={!projects.length}><option value="">Select a project</option>{projects.map((project) => <option value={project._id} key={project._id}>{project.code} · {project.name}</option>)}</select></label></div>{projectLoading ? <div className="analytics-loading">Loading project reports...</div> : projectSummary ? <ProjectReport summary={projectSummary} velocity={projectVelocity} /> : <div className="analytics-loading">{projectError || 'Select a project to view its reports.'}</div>}</section>
      {adminError && <div className="analytics-panel report-error">{adminError}</div>}
      <section className="analytics-panel agent-report-panel"><h2>Tickets by agent</h2><p>Assignment workload and status totals for the team.</p>{agentTickets?.data.length ? <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Agent</th><th>Total</th><th>Open</th><th>In progress</th><th>On hold</th><th>Resolved</th><th>Closed</th></tr></thead><tbody>{agentTickets.data.map((agent) => <tr key={agent.agent_id}><td><strong>{agent.agent_name}</strong></td><td>{agent.total_tickets}</td><td>{agent.open_tickets}</td><td>{agent.in_progress_tickets}</td><td>{agent.on_hold_tickets}</td><td>{agent.resolved_tickets}</td><td>{agent.closed_tickets}</td></tr>)}</tbody></table></div> : <div className="analytics-loading">Agent report is unavailable or has no assigned tickets.</div>}</section>
      <section className="analytics-bottom"><section className="analytics-panel"><h2>Overdue by priority</h2><p>Open tickets past their due date.</p>{overdueTickets ? Object.entries(overdueTickets.by_priority).map(([priority, count]) => <div className="ranking-row" key={priority}><strong>{label(priority)}</strong><span>{count} tickets</span></div>) : <div className="analytics-loading">Overdue report is unavailable.</div>}</section><section className="analytics-panel"><h2>Resolution time by priority</h2><p>Average time from ticket creation to resolution.</p>{resolutionTime ? Object.entries(resolutionTime.by_priority).map(([priority, hours]) => <div className="ranking-row" key={priority}><strong>{label(priority)}</strong><span>{formatHours(hours)}</span></div>) : <div className="analytics-loading">Resolution report is unavailable.</div>}</section></section>
    </>}
  </div>
}
