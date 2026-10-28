import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteProject } from '../api/projectApi'
import type { Project } from '../types/project.types'

type Props = { project: Project; view?: 'grid' | 'list'; onDeleted?: () => Promise<void> | void; onAddRepository?: (project: Project) => void }

function ProjectActionsMenu({ project, onDeleted }: { project: Project; onDeleted?: () => Promise<void> | void }) {
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return undefined
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  function openMenu(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    setError('')
    setIsOpen((current) => !current)
  }

  function openSettings(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    setIsOpen(false)
    navigate(`/projects/${project._id}/settings`)
  }

  async function removeProject() {
    if (!window.confirm(`Delete ${project.name}? This will archive the project and remove it from the project list.`)) return
    setIsDeleting(true)
    setError('')
    try {
      await deleteProject(project._id)
      await onDeleted?.()
      setIsOpen(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete project.')
    } finally {
      setIsDeleting(false)
    }
  }

  return <div className="project-row-menu" ref={menuRef}>
    <button className="project-menu-button" type="button" aria-label={`Options for ${project.name}`} aria-haspopup="menu" aria-expanded={isOpen} onClick={openMenu}>•••</button>
    {isOpen && <div className="project-actions-menu" role="menu">
      <button type="button" role="menuitem" onClick={openSettings}>✎ <span>Update project</span></button>
      <button className="danger" type="button" role="menuitem" disabled={isDeleting} onClick={(event) => { event.preventDefault(); event.stopPropagation(); void removeProject() }}>⌫ <span>{isDeleting ? 'Deleting...' : 'Delete project'}</span></button>
      {error && <span className="project-menu-error" role="alert">{error}</span>}
    </div>}
  </div>
}

export function ProjectCard({ project, view = 'grid', onDeleted, onAddRepository }: Props) {
  const initials = project.name.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase()
  const repositoryValue = project.repository_url ?? project.repo_url ?? project.repository
  let repositoryUrl: URL | null = null
  if (repositoryValue) {
    try {
      const parsedUrl = new URL(repositoryValue)
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') repositoryUrl = parsedUrl
    } catch {
      repositoryUrl = null
    }
  }
  if (view === 'list') return <div className="project-list-row"><Link className="project-name-cell" to={`/projects/${project._id}`}><span className="project-icon violet" aria-hidden="true">{initials}</span><div><strong>{project.name}</strong><small>{project.code}</small></div></Link><div className="project-repository-cell">{repositoryUrl ? <a className="project-repository-link" href={repositoryUrl.href} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label={`Open repository for ${project.name}`}><span aria-hidden="true">↗</span><span>{repositoryUrl.hostname.replace(/^www\./, '')}</span></a> : <button className="project-repository-add-link" type="button" onClick={() => onAddRepository?.(project)}>＋ Add link</button>}</div><span className="project-status">Pending</span><span className="project-date">▣ No date</span><span className="project-owner">SU</span><span className="project-following">Following</span><span className="project-updated">—</span><ProjectActionsMenu project={project} onDeleted={onDeleted} /></div>
  return <Link className="project-card" to={`/projects/${project._id}`}>
    <div className="project-card-header"><span className="project-icon violet">{initials}</span><span className="project-code">{project.code}</span><ProjectActionsMenu project={project} onDeleted={onDeleted} /></div>
    <div className="project-card-main"><h2>{project.name}</h2><p className="project-card-description">Project workspace and ticket activity</p></div>
    <div className="project-card-footer"><span><strong>{project.total_tickets}</strong> {project.total_tickets === 1 ? 'ticket' : 'tickets'}</span><span className="project-open">Open project <b>→</b></span></div>
  </Link>
}
