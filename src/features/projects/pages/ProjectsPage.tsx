import { useState } from 'react'
import { CreateProjectModal } from '../components/CreateProjectModal'
import { ProjectList } from '../components/ProjectList'
import { RepositoryLinkModal } from '../components/RepositoryLinkModal'
import { useProjects } from '../hooks/useProjects'
import type { Project } from '../types/project.types'
import '../components/projects.css'
import '../components/projects-jira.css'

export function ProjectsPage() {
  const { projects, isLoading, error, reload } = useProjects()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'name' | 'tickets'>('name')
  const [view, setView] = useState<'grid' | 'list'>('list')
  const [repositoryProject, setRepositoryProject] = useState<Project | null>(null)

  const visibleProjects = [...projects]
    .filter((project) => `${project.name} ${project.code}`.toLowerCase().includes(search.toLowerCase().trim()))
    .sort((first, second) => sort === 'name' ? first.name.localeCompare(second.name) : second.total_tickets - first.total_tickets)

  return <div className="page-content projects-page">
    <section className="project-directory-header"><div><p className="eyebrow">Workspace</p><h1>Projects</h1><p className="subtle">Find and manage every project in your workspace.</p></div><button className="primary-button" onClick={() => setIsCreateOpen(true)}>＋ Create project</button></section>
    <nav className="project-tabs" aria-label="Project views"><button className="project-tab active">All projects</button><button className="project-tab">Your projects</button><button className="project-tab project-tab-add">＋</button></nav>
    <section className="panel project-filter-panel">
      <div className="project-directory-toolbar"><label className="project-search project-search-wide"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" aria-label="Search projects" /></label></div>
      <div className="project-filter-row"><div className="project-filter-chips"><button># &nbsp; Filter by Tag</button><button>▣ &nbsp; Status</button><button>◉ &nbsp; Goal</button><button>♧ &nbsp; Team</button><button>♙ &nbsp; Owner</button><button>♙ &nbsp; Contributor</button><button>◉ &nbsp; Following</button><button>☆ &nbsp; Starred</button><button>⌘ &nbsp; Reporting line</button></div><div className="project-view-actions"><button className="reset-button" onClick={() => setSearch('')}>Reset</button><button className="create-view-button">▣ &nbsp; Create view</button></div></div>
    </section>
    <div className="projects-toolbar"><strong>{isLoading ? 'Loading projects...' : `Showing ${visibleProjects.length} ${visibleProjects.length === 1 ? 'project' : 'projects'}`}</strong><div className="project-table-actions"><label className="sort-control"><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value as 'name' | 'tickets')}><option value="name">Following</option><option value="tickets">Ticket count</option></select></label><div className="view-toggle"><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')}>☷</button><button className={view === 'grid' ? 'selected' : ''} onClick={() => setView('grid')}>▦</button></div><button className="secondary-button">▥ Columns</button><button className="more-button">•••</button></div></div>
    {error && <div className="inline-error"><span>{error}</span><button onClick={() => void reload()}>Try again</button></div>}
    {isLoading ? <div className="panel loading-state"><span className="spinner" />Loading your projects...</div> : <ProjectList projects={visibleProjects} view={view} onDeleted={reload} onAddRepository={setRepositoryProject} />}
    {isCreateOpen && <CreateProjectModal onClose={() => setIsCreateOpen(false)} onCreated={reload} />}
    {repositoryProject && <RepositoryLinkModal project={repositoryProject} onClose={() => setRepositoryProject(null)} onSaved={reload} />}
  </div>
}
