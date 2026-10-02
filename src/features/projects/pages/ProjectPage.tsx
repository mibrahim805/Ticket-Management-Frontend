import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TicketTable } from '../../tickets/components/TicketTable'
import { getProject, getProjectTickets } from '../api/projectApi'
import type { Project } from '../types/project.types'
import type { Ticket } from '../../tickets/types/ticket.types'
import '../components/projects.css'

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = projectId ?? ''
    if (!id) return
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const projectResponse = await getProject(id)
        if (cancelled) return
        setProject(projectResponse.project)
        const ticketResponse = await getProjectTickets(projectResponse.project.code)
        if (!cancelled) setTickets(ticketResponse.data)
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Unable to load project.')
      } finally { if (!cancelled) setIsLoading(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [projectId])

  if (isLoading) return <div className="page-content"><div className="panel loading-state"><span className="spinner" />Loading project...</div></div>
  if (error || !project) return <div className="page-content"><div className="inline-error"><span>{error || 'Project not found.'}</span><Link to="/projects">Back to projects</Link></div></div>

  const initials = project.name.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase()
  const inProgress = tickets.filter((ticket) => ticket.current_status_name?.toLowerCase().includes('progress')).length
  const completed = tickets.filter((ticket) => ['done', 'closed', 'resolved'].some((status) => ticket.current_status_name?.toLowerCase().includes(status))).length
  const completion = tickets.length ? Math.round((completed / tickets.length) * 100) : 0
  return <div className="page-content project-page">
    <div className="ticket-breadcrumb"><Link to="/projects">Projects</Link><span>/</span><span>{project.code}</span></div>
    <section className="project-hero project-reference-hero"><div className="project-hero-identity"><span className="project-hero-icon">{initials}</span><div><div className="project-reference-title"><h1>{project.name}</h1><span className="project-active-badge">● Active</span></div><p className="subtle">Project workspace for {project.code} development and maintenance.</p></div></div><Link className="secondary-button" to={`/projects/${project._id}/board`}>⚙ Project settings</Link></section>
    <nav className="project-detail-tabs" aria-label="Project sections"><a className="active" href="#overview">Overview</a><a href="#issues">Issues</a><a href={`/projects/${project._id}/board`}>Sprints</a><a href="#members">Members</a><a href="#reports">Reports</a></nav>
    <section className="project-overview-grid" id="overview">
      <article className="panel sprint-panel"><div className="reference-panel-heading"><div><h2>Current Sprint</h2><p>Sprint 5 · Oct 1 – Oct 14</p></div><Link to={`/projects/${project._id}/board`}>View sprint →</Link></div><div className="progress-track"><span style={{ width: `${Math.max(completion, 12)}%` }} /></div><div className="progress-caption"><strong>{completed} / {tickets.length || project.total_tickets} issues</strong><span>{completion}%</span></div><div className="sprint-stats"><div><small>To do</small><strong>{Math.max(tickets.length - inProgress - completed, 0)}</strong></div><div><small>In progress</small><strong>{inProgress}</strong></div><div><small>In review</small><strong>0</strong></div><div><small>Done</small><strong>{completed}</strong></div></div></article>
      <article className="panel breakdown-panel"><h2>Ticket breakdown</h2><div className="breakdown-content"><div className="donut-chart"><strong>{project.total_tickets}</strong><small>Total issues</small></div><div className="breakdown-legend"><span><i className="legend-bug" />Bug <b>{tickets.filter((ticket) => ticket.category === 'bug').length}</b></span><span><i className="legend-feature" />Feature <b>0</b></span><span><i className="legend-task" />Task <b>{tickets.filter((ticket) => ticket.issue_type === 'task').length}</b></span><span><i className="legend-story" />Story <b>0</b></span></div></div></article>
    </section>
    <section className="project-detail-lower-grid" id="issues"><article className="panel recent-issues-panel"><div className="reference-panel-heading"><h2>Recent issues</h2><Link to={`/tickets?project=${project.code}`}>View all →</Link></div><TicketTable tickets={tickets} /></article><aside className="panel sprint-goals-panel"><h2>Sprint goals</h2><label><input type="checkbox" checked={completed > 0} readOnly /> Complete project integration</label><label><input type="checkbox" readOnly /> Fix authentication flow issues</label><label><input type="checkbox" readOnly /> Update documentation</label><div className="goal-progress"><span>{completed > 0 ? '1/3' : '0/3'} completed</span><div><i style={{ width: `${completed > 0 ? 33 : 0}%` }} /></div></div></aside></section>
  </div>
}
