import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { updateProject } from '../api/projectApi'
import type { Project } from '../types/project.types'

type Props = { project: Project; onClose: () => void; onSaved: () => Promise<void> }

export function RepositoryLinkModal({ project, onClose, onSaved }: Props) {
  const [repositoryUrl, setRepositoryUrl] = useState(project.repository_url ?? project.repo_url ?? project.repository ?? '')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  async function saveRepositoryLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await updateProject(project._id, { repository_url: repositoryUrl })
      await onSaved()
      onClose()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save repository link.')
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(<div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal repository-link-modal" role="dialog" aria-modal="true" aria-labelledby="repository-link-title">
      <div className="modal-header"><div><p className="eyebrow">Project repository</p><h2 id="repository-link-title">Add repository link</h2></div><button className="modal-close" type="button" onClick={onClose} aria-label="Close">×</button></div>
      <form className="repository-link-form" onSubmit={(event) => void saveRepositoryLink(event)}>
        <p className="repository-link-project">{project.name}</p>
        <label>Repository URL<input type="url" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/organization/repository" maxLength={2048} required autoFocus /></label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save link'}</button></div>
      </form>
    </section>
  </div>, document.body)
}
