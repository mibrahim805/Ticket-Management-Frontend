import { useState } from 'react'
import { CreateProjectModal } from '../components/CreateProjectModal'
import { ProjectList } from '../components/ProjectList'
import { useProjects } from '../hooks/useProjects'
import '../components/projects.css'
import '../components/projects-jira.css'

export function ProjectsPage() {
  const { projects, isLoading, error, reload } = useProjects()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'tickets'>('name')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const visibleProjects = [...projects]
    .filter((project) => `${project.name} ${project.code}`.toLowerCase().includes(search.toLowerCase().trim()))
    .sort((first, second) => sort === 'name' ? first.name.localeCompare(second.name) : second.total_tickets - first.total_tickets)

  return <div className="page-content projects-page">
    <section className="project-directory-header"><div><p className="eyebrow">Workspace / Projects</p><h1>Projects</h1><p className="subtle">Plan, track, and organize work across your project spaces.</p></div><button className="primary-button" onClick={() => setIsCreateOpen(true)}>＋ Create project</button></section>
    <nav className="project-tabs" aria-label="Project views"><button className="project-tab active">All projects <span>{projects.length}</span></button></nav>
    <section className="project-directory-toolbar"><label className="project-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" aria-label="Search projects" /></label><div className="project-toolbar-actions"><label className="sort-control"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value as 'name' | 'tickets')}><option value="name">Name</option><option value="tickets">Ticket count</option></select></label><div className="view-toggle" aria-label="Project layout"><button className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')} aria-label="Grid view">▦</button><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')} aria-label="List view">☷</button></div><button className="refresh-button" onClick={() => void reload()} disabled={isLoading}>↻ Refresh</button></div></section>
    <div className="projects-toolbar"><span>{isLoading ? 'Loading projects...' : `${visibleProjects.length} ${visibleProjects.length === 1 ? 'project' : 'projects'}`}</span><span className="project-access-label">Accessible to you</span></div>
    {error && <div className="inline-error"><span>{error}</span><button onClick={() => void reload()}>Try again</button></div>}
    {isLoading ? <div className="panel loading-state"><span className="spinner" />Loading your projects...</div> : <ProjectList projects={visibleProjects} view={view} />}
    {isCreateOpen && <CreateProjectModal onClose={() => setIsCreateOpen(false)} onCreated={reload} />}
  </div>
}
