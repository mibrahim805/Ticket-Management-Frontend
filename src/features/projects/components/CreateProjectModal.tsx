import { useState } from 'react'
import type { FormEvent } from 'react'
import { createProject } from '../api/projectApi'

type Props = { onClose: () => void; onCreated: () => Promise<void> }

export function CreateProjectModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try { await createProject({ name, code }); await onCreated(); onClose() } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to create project.') } finally { setIsSubmitting(false) }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-project-title">
      <div className="modal-header"><div><p className="eyebrow">New workspace</p><h2 id="create-project-title">Create project</h2></div><button className="modal-close" onClick={onClose} aria-label="Close">×</button></div>
      <form className="project-form" onSubmit={handleSubmit}>
        <label>Project name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Office Management System" minLength={1} maxLength={100} required autoFocus /></label>
        <label>Project key<input value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="OMS" minLength={2} maxLength={10} pattern="[A-Z][A-Z0-9]{1,9}" required /><small>2–10 uppercase letters or numbers, beginning with a letter.</small></label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create project'}</button></div>
      </form>
    </section>
  </div>
}
