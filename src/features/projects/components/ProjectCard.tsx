import { Link } from 'react-router-dom'
import type { Project } from '../types/project.types'

type Props = { project: Project }

export function ProjectCard({ project }: Props) {
  const initials = project.name.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase()
  return <Link className="project-card" to={`/projects/${project._id}`}>
    <div className="project-card-header"><span className="project-icon violet">{initials}</span><span className="project-code">{project.code}</span><button className="project-menu" aria-label={`Options for ${project.name}`} onClick={(event) => event.preventDefault()}>•••</button></div>
    <h2>{project.name}</h2>
    <p className="project-card-description">Project workspace and ticket activity</p>
    <div className="project-card-footer"><span><strong>{project.total_tickets}</strong> {project.total_tickets === 1 ? 'ticket' : 'tickets'}</span><span className="project-open">Open project <b>→</b></span></div>
  </Link>
}
