import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { createProject } from '../api/projectApi'

type Props = { onClose: () => void; onCreated: () => Promise<void> }

export function CreateProjectModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimer = useRef<number | null>(null)

  const requestClose = useCallback(() => {
    if (closeTimer.current !== null) return
    setIsClosing(true)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    closeTimer.current = window.setTimeout(onClose, 280)
  }, [onClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function closeOnEscape(event: KeyboardEvent) { if (event.key === 'Escape') requestClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current)
    }
  }, [requestClose])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try { await createProject({ name, code, repository_url: repositoryUrl }); await onCreated(); requestClose() } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to create project.') } finally { setIsSubmitting(false) }
  }

  return createPortal(<div className={`creation-drawer-backdrop ${isClosing ? 'is-closing' : ''}`} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && requestClose()}>
    <section className="creation-drawer project-creation-drawer" role="dialog" aria-modal="true" aria-labelledby="create-project-title">
      <div className="modal-header"><div><p className="eyebrow">New workspace</p><h2 id="create-project-title">Create project</h2></div><button className="modal-close" type="button" onClick={requestClose} aria-label="Close">×</button></div>
      <form className="project-form project-drawer-form" onSubmit={handleSubmit}>
        <label>Project name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Office Management System" minLength={1} maxLength={100} required autoFocus /></label>
        <label>Project key<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="OMS" minLength={2} maxLength={10} pattern="[A-Z][A-Z0-9]{1,9}" required /><small>2–10 uppercase letters or numbers, beginning with a letter.</small></label>
        <label>Repository URL<input type="url" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/organization/repository" maxLength={2048} /></label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={requestClose}>Cancel</button><button className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create project'}</button></div>
      </form>
    </section>
  </div>, document.body)
}
