import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useProjects } from '../../projects/hooks/useProjects'
import { createTicket } from '../api/ticketApi'
import type { CreatedTicket, CreateTicketRequest, TicketCategory, TicketIssueType, TicketPriority } from '../types/ticket.types'
import './tickets.css'

const initialForm: CreateTicketRequest = {
  project_id: '', title: '', description: '', category: 'feature_request', issue_type: 'task', labels: [], components: [], priority: 'medium',
}

function splitValues(value: string) { return value.split(',').map((item) => item.trim()).filter(Boolean) }

type Props = {
  presentation?: 'page' | 'drawer'
  initialProjectId?: string
  onClose?: () => void
  onCreated?: (ticket: CreatedTicket) => void
}

export function CreateTicketPage({ presentation = 'page', initialProjectId, onClose, onCreated }: Props) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { projects, isLoading: projectsLoading, error: projectsError } = useProjects()
  const [form, setForm] = useState<CreateTicketRequest>(() => ({ ...initialForm, project_id: initialProjectId ?? searchParams.get('project') ?? '' }))
  const [labelsText, setLabelsText] = useState('')
  const [componentsText, setComponentsText] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function update<K extends keyof CreateTicketRequest>(field: K, value: CreateTicketRequest[K]) { setForm((current) => ({ ...current, [field]: value })) }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!form.project_id) { setError('Select a project first.'); return }
    if (form.issue_type === 'subtask' && !form.parent_id) { setError('A subtask requires a parent issue ID.'); return }
    if (form.issue_type !== 'subtask' && form.parent_id) { setError('Only subtasks can have a parent issue ID.'); return }
    if (form.issue_type === 'epic' && form.epic_id) { setError('An epic cannot belong to another epic.'); return }

    setIsSubmitting(true)
    try {
      const ticket = await createTicket({ ...form, labels: splitValues(labelsText), components: splitValues(componentsText), epic_id: form.epic_id || undefined, parent_id: form.parent_id || undefined, story_points: form.story_points || undefined })
      if (presentation === 'drawer') onCreated?.(ticket)
      else navigate('/dashboard', { replace: true, state: { createdTicket: ticket.ticket_code } })
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create ticket.')
    } finally { setIsSubmitting(false) }
  }

  return <div className={`page-content ticket-create-page ${presentation === 'drawer' ? 'ticket-create-drawer-content' : ''}`}>
    {presentation === 'page' && <div className="ticket-breadcrumb"><Link to="/dashboard">Dashboard</Link><span>/</span><span>Create ticket</span></div>}
    <section className="ticket-create-heading"><div><p className="eyebrow">Ticket management</p><h1 id={presentation === 'drawer' ? 'create-ticket-drawer-title' : undefined}>Create ticket</h1><p className="subtle">Capture the issue details and place it in the correct project workflow.</p></div>{presentation === 'drawer' && <button className="creation-drawer-close" type="button" onClick={onClose} aria-label="Close create ticket panel" autoFocus>×</button>}</section>
    <form className="ticket-form" onSubmit={handleSubmit}>
      <section className="form-panel"><div className="form-section-heading"><h2>Basic details</h2><p>Describe the work that needs to be done.</p></div>
        <div className="form-grid two-columns">
          <label>Project <select value={form.project_id} onChange={(event) => update('project_id', event.target.value)} required disabled={projectsLoading}><option value="">{projectsLoading ? 'Loading projects...' : 'Select a project'}</option>{projects.map((project) => <option value={project._id} key={project._id}>{project.code} · {project.name}</option>)}</select>{projectsError && <small className="field-error">{projectsError}</small>}</label>
          <label>Issue type <select value={form.issue_type} onChange={(event) => update('issue_type', event.target.value as TicketIssueType)}><option value="task">Task</option><option value="bug">Bug</option><option value="story">Story</option><option value="epic">Epic</option><option value="subtask">Subtask</option></select></label>
        </div>
        <label>Title<input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Write a clear, concise title" minLength={1} maxLength={255} required /></label>
        <label>Description<textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Add context, acceptance criteria, or reproduction steps" maxLength={10000} rows={7} /></label>
      </section>

      <section className="form-panel"><div className="form-section-heading"><h2>Classification</h2><p>Help your team filter and prioritize this ticket.</p></div>
        <div className="form-grid two-columns">
          <label>Category <select value={form.category} onChange={(event) => update('category', event.target.value as TicketCategory)}><option value="bug">Bug</option><option value="feature_request">Feature request</option><option value="support">Support</option></select></label>
          <label>Priority <select value={form.priority} onChange={(event) => update('priority', event.target.value as TicketPriority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select><small>The backend calculates the due date from this priority.</small></label>
          <label>Story points <input type="number" min="0" max="1000" value={form.story_points ?? ''} onChange={(event) => update('story_points', event.target.value ? Number(event.target.value) : undefined)} placeholder="Optional" /></label>
          <label>Labels <input value={labelsText} onChange={(event) => setLabelsText(event.target.value)} placeholder="frontend, api, accessibility" /><small>Separate labels with commas.</small></label>
          <label className="full-width">Components <input value={componentsText} onChange={(event) => setComponentsText(event.target.value)} placeholder="Component IDs, separated by commas" /><small>Use component IDs belonging to the selected project.</small></label>
        </div>
      </section>

      {form.issue_type !== 'epic' && <section className="form-panel"><div className="form-section-heading"><h2>Relationships <span className="optional-label">Optional</span></h2><p>Attach this ticket to an existing epic or parent issue.</p></div>
        <div className="form-grid two-columns">
          {form.issue_type !== 'subtask' && <label>Epic ID <input value={form.epic_id ?? ''} onChange={(event) => update('epic_id', event.target.value)} placeholder="Optional epic ID" /></label>}
          {form.issue_type === 'subtask' && <label>Parent issue ID <input value={form.parent_id ?? ''} onChange={(event) => update('parent_id', event.target.value)} placeholder="Required for a subtask" required /></label>}
        </div>
      </section>}

      {error && <p className="form-error ticket-form-error">{error}</p>}
      <div className="ticket-form-actions">{presentation === 'drawer' ? <button className="secondary-button" type="button" onClick={onClose}>Cancel</button> : <Link className="secondary-button" to="/dashboard">Cancel</Link>}<button className="primary-button" disabled={isSubmitting || projectsLoading}>{isSubmitting ? 'Creating ticket...' : 'Create ticket'}</button></div>
    </form>
  </div>
}
