import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { executeTicketTransition, getTicketTransitions } from '../../workflow/api/workflowApi'
import type { TicketTransition } from '../../workflow/types/workflow.types'
import { createTicketLink, getTicketCapabilities, getTicketDetails, getTicketLinks, subscribeToTicket, unsubscribeFromTicket } from '../api/ticketApi'
import type { Ticket, TicketCapabilities, TicketComment, TicketDetails, TicketLink, TicketLinkType } from '../types/ticket.types'
import './ticket-detail.css'

const capabilityLabels: Record<string, string> = {
  view_ticket: 'View ticket',
  update_ticket: 'Update ticket',
  assign_tickets: 'Assign tickets',
  reassign_tickets: 'Reassign tickets',
  transition_tickets: 'Transition tickets',
  link_tickets: 'Link tickets',
  delete_tickets: 'Delete tickets',
  upload_attachments: 'Upload attachments',
  view_attachments: 'View attachments',
}

function requestError(error: unknown, fallback: string) { return error instanceof Error ? error.message : fallback }
function commentText(comment: TicketComment) { return comment.message || comment.body || comment.content || '' }

export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const { user } = useAuth()
  const [details, setDetails] = useState<TicketDetails | null>(null)
  const [capabilities, setCapabilities] = useState<TicketCapabilities | null>(null)
  const [links, setLinks] = useState<TicketLink[]>([])
  const [transitions, setTransitions] = useState<TicketTransition[]>([])
  const [targetTicketId, setTargetTicketId] = useState('')
  const [linkType, setLinkType] = useState<TicketLinkType>('relates_to')
  const [isWatching, setIsWatching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadTicket(id: string) {
    setIsLoading(true)
    setError('')
    const results = await Promise.allSettled([getTicketDetails(id), getTicketCapabilities(id), getTicketLinks(id), getTicketTransitions(id)])
    const [detailsResult, capabilitiesResult, linksResult, transitionsResult] = results
    if (detailsResult.status === 'rejected') throw detailsResult.reason
    setDetails(detailsResult.value)
    if (capabilitiesResult.status === 'fulfilled') setCapabilities(capabilitiesResult.value)
    if (linksResult.status === 'fulfilled') setLinks(linksResult.value.links)
    if (transitionsResult.status === 'fulfilled') setTransitions(transitionsResult.value.transitions)
    const watcherId = user?.user_id
    setIsWatching(Boolean(watcherId && detailsResult.value.tickets.watchers?.includes(watcherId)))
    setIsLoading(false)
  }

  useEffect(() => {
    if (!ticketId) return
    void loadTicket(ticketId).catch((requestErrorValue) => { setError(requestError(requestErrorValue, 'Unable to load ticket.')); setIsLoading(false) })
  }, [ticketId, user?.user_id])

  async function toggleWatcher() {
    if (!ticketId) return
    setBusy('watcher')
    setError('')
    try {
      const response = isWatching ? await unsubscribeFromTicket(ticketId) : await subscribeToTicket(ticketId)
      setIsWatching(!isWatching)
      setDetails((current) => current ? { ...current, tickets: { ...current.tickets, watchers: response.watchers } } : current)
      setMessage(isWatching ? 'You unsubscribed from this ticket.' : 'You are now watching this ticket.')
    } catch (requestErrorValue) { setError(requestError(requestErrorValue, 'Unable to update ticket watcher status.')) } finally { setBusy('') }
  }

  async function moveTicket(transition: TicketTransition) {
    if (!ticketId || !transition.available) return
    setBusy(`transition-${transition._id}`)
    setError('')
    try {
      await executeTicketTransition(ticketId, transition._id)
      await loadTicket(ticketId)
      setMessage('Ticket status updated.')
    } catch (requestErrorValue) { setError(requestError(requestErrorValue, 'Unable to transition ticket.')) } finally { setBusy('') }
  }

  async function addLink(event: FormEvent) {
    event.preventDefault()
    if (!ticketId || !targetTicketId.trim()) return
    setBusy('link')
    setError('')
    try {
      const link = await createTicketLink(ticketId, targetTicketId.trim(), linkType)
      setLinks((current) => [...current, link])
      setTargetTicketId('')
      setMessage('Ticket link created.')
    } catch (requestErrorValue) { setError(requestError(requestErrorValue, 'Unable to create ticket link.')) } finally { setBusy('') }
  }

  if (isLoading) return <div className="page-content"><div className="panel loading-state"><span className="spinner" />Loading ticket...</div></div>
  if (!details) return <div className="page-content"><div className="inline-error"><span>{error || 'Ticket not found.'}</span><Link to="/tickets">Back to tickets</Link></div></div>

  const ticket = details.tickets
  const watcherCount = ticket.watchers?.length || 0
  return <div className="page-content ticket-detail-page">
    <div className="ticket-breadcrumb"><Link to="/tickets">Tickets</Link><span>/</span><span>{ticket.ticket_code}</span></div>
    <section className="ticket-detail-heading"><div><p className="eyebrow">{ticket.project_key} · {ticket.issue_type}</p><h1>{ticket.title}</h1><p className="subtle">{ticket.ticket_code} · {ticket.current_status_name || 'Open'}</p></div><div className="ticket-detail-actions"><button className="secondary-button" type="button" onClick={() => void toggleWatcher()} disabled={busy === 'watcher'}>{busy === 'watcher' ? 'Updating...' : isWatching ? '★ Watching' : '☆ Watch ticket'}</button></div></section>
    {error && <div className="inline-error"><span>{error}</span><button type="button" onClick={() => ticketId && void loadTicket(ticketId)}>Try again</button></div>}
    {message && <div className="members-message members-success">{message}</div>}
    <div className="ticket-detail-grid">
      <main>
        <section className="panel ticket-detail-panel"><div className="detail-panel-heading"><h2>Description</h2><span className={`priority-pill ${ticket.priority}`}>{ticket.priority}</span></div><p className="ticket-description">{ticket.description || 'No description provided.'}</p><div className="ticket-fact-grid"><div><small>Category</small><strong>{ticket.category}</strong></div><div><small>Issue type</small><strong>{ticket.issue_type}</strong></div><div><small>Due date</small><strong>{ticket.due_date ? new Date(ticket.due_date).toLocaleDateString() : 'No due date'}</strong></div><div><small>Watchers</small><strong>{watcherCount}</strong></div></div></section>
        <section className="panel ticket-detail-panel"><div className="detail-panel-heading"><div><h2>Workflow transitions</h2><p>Available actions for this ticket.</p></div></div>{transitions.length ? <div className="detail-transition-list">{transitions.map((transition) => <div className="detail-transition-row" key={transition._id}><div><strong>{transition.name}</strong><small>Move to {transition.to_status_name || transition.to_status_id}</small></div><button className="primary-button" type="button" disabled={!transition.available || busy === `transition-${transition._id}`} onClick={() => void moveTicket(transition)}>{transition.available ? (busy === `transition-${transition._id}` ? 'Moving...' : 'Move') : transition.blocked_reason || 'Unavailable'}</button></div>)}</div> : <p className="settings-muted">No transitions are available for this ticket.</p>}</section>
        <section className="panel ticket-detail-panel"><div className="detail-panel-heading"><div><h2>Comments</h2><p>{details.comments.length} comments visible to you.</p></div></div>{details.comments.length ? <div className="comment-list">{details.comments.map((comment) => <article className="comment-row" key={comment._id}><div><strong>{comment.author || comment.created_by || 'User'}</strong><small>{comment.visibility || 'public'}{comment.created_at ? ` · ${new Date(comment.created_at).toLocaleString()}` : ''}</small></div><p>{commentText(comment) || 'Comment has no text.'}</p></article>)}</div> : <p className="settings-muted">No comments yet.</p>}</section>
      </main>
      <aside>
        <section className="panel ticket-detail-panel"><div className="detail-panel-heading"><h2>Capabilities</h2><span className="settings-badge">{capabilities?.role || '—'}</span></div>{capabilities ? <><div className="tag-list">{capabilities.capabilities.map((capability) => <span key={capability}>{capabilityLabels[capability] || capability}</span>)}</div><p className="capability-context">{capabilities.context.is_assignee ? 'You are assigned to this ticket.' : capabilities.context.is_creator ? 'You created this ticket.' : 'Access is based on your project role.'}</p></> : <p className="settings-muted">Ticket capabilities could not be loaded.</p>}</section>
        <section className="panel ticket-detail-panel"><div className="detail-panel-heading"><div><h2>Issue links</h2><p>Connect related tickets.</p></div></div><form className="ticket-link-form" onSubmit={(event) => void addLink(event)}><input value={targetTicketId} onChange={(event) => setTargetTicketId(event.target.value)} placeholder="Target ticket ID" required /><select value={linkType} onChange={(event) => setLinkType(event.target.value as TicketLinkType)}><option value="relates_to">Relates to</option><option value="blocks">Blocks</option><option value="duplicates">Duplicates</option></select><button className="primary-button" type="submit" disabled={busy === 'link'}>{busy === 'link' ? 'Adding...' : 'Add link'}</button></form><div className="ticket-link-list">{links.length ? links.map((link) => <div key={link._id}><span>{link.link_type.replaceAll('_', ' ')}</span><strong>{link.from_ticket_id === ticket._id ? `→ ${link.to_ticket_id}` : `← ${link.from_ticket_id}`}</strong></div>) : <p className="settings-muted">No linked tickets.</p>}</div></section>
      </aside>
    </div>
  </div>
}
