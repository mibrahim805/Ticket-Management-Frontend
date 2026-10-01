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
  return <div className="page-content project-page">
    <div className="ticket-breadcrumb"><Link to="/projects">Projects</Link><span>/</span><span>{project.code}</span></div>
    <section className="project-hero"><div className="project-hero-identity"><span className="project-hero-icon">{initials}</span><div><p className="eyebrow">Project workspace · {project.code}</p><h1>{project.name}</h1><p className="subtle">Organize tickets, workflows, and team activity in one place.</p></div></div><div className="project-hero-actions"><Link className="secondary-button" to={`/projects/${project._id}/board`}>Open board</Link><Link className="primary-button" to={`/tickets/new?project=${project._id}`}>＋ Create ticket</Link></div></section>
    <div className="project-stat-grid"><article className="stat-card"><div className="stat-icon indigo">☷</div><div><span>Total tickets</span><strong>{project.total_tickets}</strong><small className="muted">Across this project</small></div></article><article className="stat-card"><div className="stat-icon green">✓</div><div><span>Workflow statuses</span><strong>{project.assigned_statuses.length}</strong><small className="muted">Assigned to project</small></div></article><article className="stat-card"><div className="stat-icon amber">#</div><div><span>Project key</span><strong>{project.code}</strong><small className="muted">Ticket prefix</small></div></article></div>
    <section className="project-content-grid"><div><div className="project-section-heading"><div><h2>Recent tickets</h2><p>Latest work created in {project.code}.</p></div><Link to={`/tickets?project=${project.code}`}>View all tickets →</Link></div><TicketTable tickets={tickets} /></div><aside className="panel project-details"><h2>Project details</h2><div className="detail-row"><span>Project name</span><strong>{project.name}</strong></div><div className="detail-row"><span>Project key</span><strong>{project.code}</strong></div><div className="detail-row"><span>Default status</span><strong>{project.default_status_id ? 'Configured' : 'Not configured'}</strong></div><div className="detail-row"><span>Access</span><strong>Project members</strong></div><Link className="secondary-button details-button" to={`/tickets?project=${project.code}`}>Browse project tickets</Link></aside></section>
  </div>
}
