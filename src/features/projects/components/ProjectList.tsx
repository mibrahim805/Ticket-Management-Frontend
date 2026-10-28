import { ProjectCard } from './ProjectCard'
import type { Project } from '../types/project.types'

export function ProjectList({ projects, view, onDeleted, onAddRepository }: { projects: Project[]; view: 'grid' | 'list'; onDeleted?: () => Promise<void> | void; onAddRepository?: (project: Project) => void }) {
  if (projects.length === 0) return <div className="panel projects-empty"><div className="empty-icon">▱</div><h2>No projects yet</h2><p>Create your first project to start organizing tickets and team work.</p></div>
  if (view === 'list') return <div className="projects-list"><div className="projects-table-header"><span>Name</span><span>Repository</span><span>Status</span><span>Target date</span><span>Owner</span><span>Following</span><span>Last updated</span><span /></div>{projects.map((project) => <ProjectCard key={project._id} project={project} view={view} onDeleted={onDeleted} onAddRepository={onAddRepository} />)}</div>
  return <div className="projects-grid jira-project-grid">{projects.map((project) => <ProjectCard key={project._id} project={project} view={view} onDeleted={onDeleted} onAddRepository={onAddRepository} />)}</div>
}
