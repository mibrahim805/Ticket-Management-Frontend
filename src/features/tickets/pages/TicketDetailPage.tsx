import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { executeTicketTransition, getTicketTransitions } from '../../workflow/api/workflowApi'
import type { TicketTransition } from '../../workflow/types/workflow.types'
import { getTicketActivity } from '../../activity/api/activityApi'
import type { ActivityEvent } from '../../activity/types/activity.types'
import { deleteAttachment, downloadAttachment, getAttachments, uploadAttachment, type TicketAttachment } from '../api/attachmentApi'
import { createComment, createCommentReply, deleteComment, getComments, updateComment, type CommentVisibility } from '../api/commentApi'
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
function formatFileSize(size: number) { if (size < 1024) return `${size} B`; if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`; return `${(size / (1024 * 1024)).toFixed(1)} MB` }

export function TicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const { user } = useAuth()
  const [details, setDetails] = useState<TicketDetails | null>(null)
  const [comments, setComments] = useState<TicketComment[]>([])
  const [capabilities, setCapabilities] = useState<TicketCapabilities | null>(null)
  const [links, setLinks] = useState<TicketLink[]>([])
  const [transitions, setTransitions] = useState<TicketTransition[]>([])
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [attachments, setAttachments] = useState<TicketAttachment[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [attachmentError, setAttachmentError] = useState('')
  const [targetTicketId, setTargetTicketId] = useState('')
  const [linkType, setLinkType] = useState<TicketLinkType>('relates_to')
  const [isWatching, setIsWatching] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [commentMessage, setCommentMessage] = useState('')
  const [commentVisibility, setCommentVisibility] = useState<CommentVisibility>('public')
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState('')

  async function loadTicket(id: string) {
    setIsLoading(true)
    setError('')
    const results = await Promise.allSettled([getTicketDetails(id), getComments(id), getTicketCapabilities(id), getTicketLinks(id), getTicketTransitions(id), getTicketActivity(id), getAttachments(id)])
    const [detailsResult, commentsResult, capabilitiesResult, linksResult, transitionsResult, activityResult, attachmentsResult] = results
    if (detailsResult.status === 'rejected') throw detailsResult.reason
    setDetails(detailsResult.value)
    setComments(commentsResult.status === 'fulfilled' ? commentsResult.value : detailsResult.value.comments)
    if (capabilitiesResult.status === 'fulfilled') setCapabilities(capabilitiesResult.value)
    if (linksResult.status === 'fulfilled') setLinks(linksResult.value.links)
    if (transitionsResult.status === 'fulfilled') setTransitions(transitionsResult.value.transitions)
    if (activityResult.status === 'fulfilled') setActivities(activityResult.value.activities)
    if (attachmentsResult.status === 'fulfilled') setAttachments(attachmentsResult.value)
    else setAttachmentError(requestError(attachmentsResult.reason, 'Attachments are not available for this ticket.'))
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

  async function addAttachment(event: FormEvent) {
    event.preventDefault()
    if (!ticketId || !selectedFile) return
    setBusy('attachment')
    setAttachmentError('')
    try {
      await uploadAttachment(ticketId, selectedFile)
      setAttachments(await getAttachments(ticketId))
      setSelectedFile(null)
      setMessage('Attachment uploaded.')
      const input = event.currentTarget.querySelector('input[type="file"]') as HTMLInputElement | null
      if (input) input.value = ''
    } catch (requestErrorValue) { setAttachmentError(requestError(requestErrorValue, 'Unable to upload attachment.')) } finally { setBusy('') }
  }

  async function downloadFile(attachment: TicketAttachment) {
    setBusy(`download-${attachment.attachment_id}`)
    setAttachmentError('')
    try {
      const blob = await downloadAttachment(attachment.attachment_id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = attachment.original_name
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (requestErrorValue) { setAttachmentError(requestError(requestErrorValue, 'Unable to download attachment.')) } finally { setBusy('') }
  }

  async function removeAttachment(attachment: TicketAttachment) {
    if (!window.confirm(`Delete ${attachment.original_name}?`)) return
    setBusy(`delete-attachment-${attachment.attachment_id}`)
    setAttachmentError('')
    try {
      await deleteAttachment(attachment.attachment_id)
      setAttachments((current) => current.filter((item) => item.attachment_id !== attachment.attachment_id))
      setMessage('Attachment deleted.')
    } catch (requestErrorValue) { setAttachmentError(requestError(requestErrorValue, 'Unable to delete attachment.')) } finally { setBusy('') }
  }

  async function addComment(event: FormEvent) {
    event.preventDefault()
    if (!ticketId || !commentMessage.trim()) return
    setBusy('comment')
    setError('')
    try {
      const response = await createComment(ticketId, commentMessage, commentVisibility)
      setComments((current) => [...current, response.comment])
      setCommentMessage('')
      setMessage('Comment added.')
    } catch (requestErrorValue) { setError(requestError(requestErrorValue, 'Unable to add comment.')) } finally { setBusy('') }
  }

  async function addReply(event: FormEvent, parentCommentId: string) {
    event.preventDefault()
    if (!replyMessage.trim()) return
    setBusy(`reply-${parentCommentId}`)
    setError('')
    try {
      const response = await createCommentReply(parentCommentId, replyMessage)
      setComments((current) => [...current, response.comment])
      setReplyMessage('')
      setReplyingCommentId(null)
      setMessage('Reply added.')
    } catch (requestErrorValue) { setError(requestError(requestErrorValue, 'Unable to add reply.')) } finally { setBusy('') }
  }

  async function saveComment(comment: TicketComment) {
    if (!editingMessage.trim()) return
    setBusy(`edit-${comment._id}`)
    setError('')
    try {
      await updateComment(comment._id, editingMessage, comment.visibility)
      setComments((current) => current.map((item) => item._id === comment._id ? { ...item, message: editingMessage.trim() } : item))
      setEditingCommentId(null)
      setMessage('Comment updated.')
    } catch (requestErrorValue) { setError(requestError(requestErrorValue, 'Unable to update comment.')) } finally { setBusy('') }
  }

  async function removeComment(comment: TicketComment) {
    if (!window.confirm('Delete this comment?')) return
    setBusy(`delete-${comment._id}`)
    setError('')
    try {
      await deleteComment(comment._id)
      setComments((current) => current.filter((item) => item._id !== comment._id))
      setMessage('Comment deleted.')
    } catch (requestErrorValue) { setError(requestError(requestErrorValue, 'Unable to delete comment.')) } finally { setBusy('') }
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
        <section className="panel ticket-detail-panel"><div className="detail-panel-heading"><div><h2>Comments</h2><p>{comments.length} comments visible to you.</p></div></div><form className="comment-form" onSubmit={(event) => void addComment(event)}><textarea value={commentMessage} onChange={(event) => setCommentMessage(event.target.value)} placeholder="Write a comment..." rows={4} required /><div className="comment-form-actions"><select value={commentVisibility} onChange={(event) => setCommentVisibility(event.target.value as CommentVisibility)}><option value="public">Public comment</option><option value="internal">Internal comment</option></select><button className="primary-button" type="submit" disabled={busy === 'comment'}>{busy === 'comment' ? 'Adding...' : 'Add comment'}</button></div></form>{comments.length ? <div className="comment-list">{comments.map((comment) => { const isAuthor = comment.author_id === user?.user_id || comment.created_by === user?.user_id; return <article className={`comment-row ${comment.parent_id ? 'comment-reply' : ''}`} key={comment._id}><div className="comment-row-header"><div><strong>{isAuthor ? 'You' : comment.author || comment.author_id || comment.created_by || 'User'}</strong><small>{comment.visibility || 'public'}{comment.created_at ? ` · ${new Date(comment.created_at).toLocaleString()}` : ''}</small></div><div className="comment-actions">{isAuthor && <><button type="button" className="text-button" onClick={() => { setEditingCommentId(comment._id); setEditingMessage(commentText(comment)) }}>Edit</button><button type="button" className="text-button danger-text" disabled={busy === `delete-${comment._id}`} onClick={() => void removeComment(comment)}>Delete</button></>}{!comment.parent_id && <button type="button" className="text-button" onClick={() => { setReplyingCommentId(comment._id); setReplyMessage('') }}>Reply</button>}</div></div>{editingCommentId === comment._id ? <div className="comment-edit-form"><textarea value={editingMessage} onChange={(event) => setEditingMessage(event.target.value)} rows={3} /><div className="comment-form-actions"><button type="button" className="secondary-button" onClick={() => setEditingCommentId(null)}>Cancel</button><button type="button" className="primary-button" disabled={busy === `edit-${comment._id}`} onClick={() => void saveComment(comment)}>Save</button></div></div> : <p>{commentText(comment) || 'Comment has no text.'}</p>}{replyingCommentId === comment._id && <form className="reply-form" onSubmit={(event) => void addReply(event, comment._id)}><textarea value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} rows={2} placeholder="Write a reply..." required /><div className="comment-form-actions"><button type="button" className="secondary-button" onClick={() => setReplyingCommentId(null)}>Cancel</button><button type="submit" className="primary-button" disabled={busy === `reply-${comment._id}`}>Reply</button></div></form>}</article> })}</div> : <p className="settings-muted">No comments yet.</p>}</section>
        <section className="panel ticket-detail-panel"><div className="detail-panel-heading"><div><h2>Ticket activity</h2><p>Changes and actions recorded for this ticket.</p></div><span className="settings-badge">{activities.length}</span></div>{activities.length ? <div className="ticket-activity-list">{activities.slice(0, 15).map((activity) => <div className="ticket-activity-row" key={activity._id}><span className="activity-icon">↗</span><div><strong>{activity.action.replaceAll('_', ' ')}</strong><small>{activity.changed_by ? `Changed by ${activity.changed_by}` : 'Ticket activity'}{activity.changed_at ? ` · ${new Date(activity.changed_at).toLocaleString()}` : ''}</small></div></div>)}</div> : <p className="settings-muted">No ticket activity recorded.</p>}</section>
      </main>
      <aside>
        <section className="panel ticket-detail-panel"><div className="detail-panel-heading"><h2>Capabilities</h2><span className="settings-badge">{capabilities?.role || '—'}</span></div>{capabilities ? <><div className="tag-list">{capabilities.capabilities.map((capability) => <span key={capability}>{capabilityLabels[capability] || capability}</span>)}</div><p className="capability-context">{capabilities.context.is_assignee ? 'You are assigned to this ticket.' : capabilities.context.is_creator ? 'You created this ticket.' : 'Access is based on your project role.'}</p></> : <p className="settings-muted">Ticket capabilities could not be loaded.</p>}</section>
        <section className="panel ticket-detail-panel"><div className="detail-panel-heading"><div><h2>Issue links</h2><p>Connect related tickets.</p></div></div><form className="ticket-link-form" onSubmit={(event) => void addLink(event)}><input value={targetTicketId} onChange={(event) => setTargetTicketId(event.target.value)} placeholder="Target ticket ID" required /><select value={linkType} onChange={(event) => setLinkType(event.target.value as TicketLinkType)}><option value="relates_to">Relates to</option><option value="blocks">Blocks</option><option value="duplicates">Duplicates</option></select><button className="primary-button" type="submit" disabled={busy === 'link'}>{busy === 'link' ? 'Adding...' : 'Add link'}</button></form><div className="ticket-link-list">{links.length ? links.map((link) => <div key={link._id}><span>{link.link_type.replaceAll('_', ' ')}</span><strong>{link.from_ticket_id === ticket._id ? `→ ${link.to_ticket_id}` : `← ${link.from_ticket_id}`}</strong></div>) : <p className="settings-muted">No linked tickets.</p>}</div></section>
        <section className="panel ticket-detail-panel"><div className="detail-panel-heading"><div><h2>Attachments</h2><p>Files attached to this ticket.</p></div><span className="settings-badge">{attachments.length}</span></div>{attachmentError && <p className="attachment-error">{attachmentError}</p>}{capabilities?.context.can_upload_attachments && <form className="attachment-upload-form" onSubmit={(event) => void addAttachment(event)}><input type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] || null)} /><button className="primary-button" type="submit" disabled={!selectedFile || busy === 'attachment'}>{busy === 'attachment' ? 'Uploading...' : 'Upload file'}</button></form>}{attachments.length ? <div className="attachment-list">{attachments.map((attachment) => <div className="attachment-row" key={attachment.attachment_id}><div><strong>{attachment.original_name}</strong><small>{formatFileSize(attachment.size)} · {new Date(attachment.uploaded_at).toLocaleString()}</small></div><div className="attachment-actions"><button type="button" className="text-button" disabled={busy === `download-${attachment.attachment_id}`} onClick={() => void downloadFile(attachment)}>Download</button>{capabilities?.can.delete_attachments && <button type="button" className="text-button danger-text" disabled={busy === `delete-attachment-${attachment.attachment_id}`} onClick={() => void removeAttachment(attachment)}>Delete</button>}</div></div>)}</div> : !attachmentError && <p className="settings-muted">No attachments yet.</p>}</section>
      </aside>
    </div>
  </div>
}
