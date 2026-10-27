import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { getProjects } from '../features/projects/api/projectApi'
import type { Project } from '../features/projects/types/project.types'
import './sprints-overview.css'

export function SprintsOverviewPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void getProjects().then((response) => {
      if (active) setProjects(response.projects)
    }).catch((requestError) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load projects.')
    }).finally(() => {
      if (active) setIsLoading(false)
    })
    return () => { active = false }
  }, [])

  return <div className="page-content sprints-overview-page">
    <header><div><p className="eyebrow">WORKSPACE</p><h1>Sprints</h1><p className="subtle">Choose a project to open its sprint and workflow board.</p></div><Link className="primary-button" to="/projects">View projects</Link></header>
    {error && <div className="form-error">{error}</div>}
    {isLoading ? <div className="sprints-loading">Loading project boards...</div> : <section className="sprint-project-grid">
      {projects.map((project, index) => <Link className="sprint-project-card" to={`/projects/${project._id}/board`} key={project._id}>
        <span className={`sprint-project-icon sprint-color-${index % 4}`}>{project.code.slice(0, 2)}</span>
        <span><strong>{project.name}</strong><small>{project.total_tickets || 0} tickets</small></span>
        <Icon name="arrow-right" />
      </Link>)}
      {!projects.length && <div className="sprints-loading">No projects are available yet.</div>}
    </section>}
  </div>
}
