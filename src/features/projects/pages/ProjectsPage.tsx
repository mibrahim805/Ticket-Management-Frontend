import { useState } from 'react'
import { CreateProjectModal } from '../components/CreateProjectModal'
import { ProjectList } from '../components/ProjectList'
import { useProjects } from '../hooks/useProjects'
import '../components/projects.css'

export function ProjectsPage() {
  const { projects, isLoading, error, reload } = useProjects()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return <div className="page-content projects-page">
    <section className="page-heading"><div><p className="eyebrow">Workspace</p><h1>Projects</h1><p className="subtle">Manage your project workspaces and track their ticket activity.</p></div><button className="primary-button" onClick={() => setIsCreateOpen(true)}>＋ New project</button></section>
    <div className="projects-toolbar"><span>{isLoading ? 'Loading projects...' : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}</span><button className="refresh-button" onClick={() => void reload()} disabled={isLoading}>↻ Refresh</button></div>
    {error && <div className="inline-error"><span>{error}</span><button onClick={() => void reload()}>Try again</button></div>}
    {isLoading ? <div className="panel loading-state"><span className="spinner" />Loading your projects...</div> : <ProjectList projects={projects} />}
    {isCreateOpen && <CreateProjectModal onClose={() => setIsCreateOpen(false)} onCreated={reload} />}
  </div>
}
