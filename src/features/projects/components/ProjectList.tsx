import { ProjectCard } from './ProjectCard'
import type { Project } from '../types/project.types'

export function ProjectList({ projects, view }: { projects: Project[]; view: 'grid' | 'list' }) {
  if (projects.length === 0) return <div className="panel projects-empty"><div className="empty-icon">▱</div><h2>No projects yet</h2><p>Create your first project to start organizing tickets and team work.</p></div>
  return <div className={view === 'grid' ? 'projects-grid jira-project-grid' : 'projects-list'}>{projects.map((project) => <ProjectCard key={project._id} project={project} view={view} />)}</div>
}
