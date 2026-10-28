import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProject, getProjectMembers } from '../../projects/api/projectApi'
import { assignTicket, deleteTicket, updateTicket } from '../../tickets/api/ticketApi'
import { useCreateTicketDrawer } from '../../tickets/components/createTicketDrawerContext'
import type { ProjectMember } from '../../projects/types/project.types'
import type { Ticket, TicketPriority } from '../../tickets/types/ticket.types'
import { configureLinearWorkflow, executeTicketTransition, getProjectBoard, getProjectWorkflow, getTicketTransitions } from '../api/workflowApi'
import type { BoardColumn, ProjectBoard, ProjectWorkflowTransition } from '../types/workflow.types'
import './workflow-board.css'
import './workflow-setup.css'

function priorityLabel(priority: string) { return priority.charAt(0).toUpperCase() + priority.slice(1) }

function assigneeLabel(assignedAgent: string | null | undefined, members: ProjectMember[]) {
  if (!assignedAgent) return 'Unassigned'
  const member = members.find((candidate) => candidate.user_id === assignedAgent)
  return member?.name || (assignedAgent.length > 12 ? `${assignedAgent.slice(0, 8)}…` : assignedAgent)
}

function BoardTicket({ ticket, statusOptions, members, onDragStart, onMove, onAssign, onEdit, onDelete, isBusy }: {
  ticket: Ticket
  statusOptions: BoardColumn[]
  members: ProjectMember[]
  onDragStart: (ticket: Ticket) => void
  onMove: (ticket: Ticket, statusId: string) => void
  onAssign: (ticket: Ticket, agentId: string) => void
  onEdit: (ticket: Ticket) => void
  onDelete: (ticket: Ticket) => void
  isBusy: boolean
}) {
  return <article className={`board-ticket ${isBusy ? 'is-moving' : ''}`} draggable={!isBusy} onDragStart={() => onDragStart(ticket)}>
    <div className="board-ticket-top"><span className="board-ticket-code">{ticket.ticket_code}</span><span className="board-ticket-type">{ticket.issue_type}</span></div>
    <h3>{ticket.title}</h3>
    {ticket.description && <p className="board-ticket-description">{ticket.description}</p>}
    <div className="board-ticket-meta"><span className={`board-priority ${ticket.priority}`}>{priorityLabel(ticket.priority)}</span><span className="board-assignee">Assigned · {assigneeLabel(ticket.assigned_agent, members)}</span></div>
    <div className="board-ticket-actions"><button type="button" className="ticket-action" onClick={() => onEdit(ticket)}>✎ Edit</button><button type="button" className="ticket-action delete" onClick={() => onDelete(ticket)} aria-label={`Delete ${ticket.ticket_code}`}>🗑</button></div>
    <select className="board-status-select" value={ticket.current_status_id || ''} disabled={isBusy} onChange={(event) => onMove(ticket, event.target.value)} aria-label={`Change status for ${ticket.ticket_code}`}>
      <option value={ticket.current_status_id || ''}>{ticket.current_status_name || 'Current status'}</option>
      {statusOptions.filter((column) => column.status_id !== ticket.current_status_id).map((column) => <option key={column.status_id} value={column.status_id}>{column.status_name}</option>)}
    </select>
    <select className="board-assignee-select" value={ticket.assigned_agent || ''} disabled={isBusy || !members.length} onChange={(event) => { if (event.target.value) onAssign(ticket, event.target.value) }} aria-label={`Assign ${ticket.ticket_code}`}>
      <option value="">{members.length ? 'Assign to project member' : 'No assignable members'}</option>
      {members.filter((member) => member.role === 'lead' || member.role === 'member').map((member) => <option value={member.user_id} key={member.user_id}>{member.name}</option>)}
    </select>
  </article>
}

type EditDraft = { title: string; description: string; priority: TicketPriority }

export function WorkflowBoardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { openCreateTicket } = useCreateTicketDrawer()
  const [projectName, setProjectName] = useState('Project')
  const [board, setBoard] = useState<ProjectBoard | null>(null)
  const [workflowTransitions, setWorkflowTransitions] = useState<ProjectWorkflowTransition[]>([])
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null)
  const [movingTicketId, setMovingTicketId] = useState('')
  const [isConfiguringWorkflow, setIsConfiguringWorkflow] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [editDraft, setEditDraft] = useState<EditDraft>({ title: '', description: '', priority: 'medium' })
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [assigningTicketId, setAssigningTicketId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadBoard = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError('')
    try {
      const [boardResponse, workflowResponse] = await Promise.all([getProjectBoard(projectId), getProjectWorkflow(projectId)])
      setBoard(boardResponse)
      setWorkflowTransitions(workflowResponse.transitions)
      try { setProjectMembers(await getProjectMembers(projectId)) } catch { setProjectMembers([]) }
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load the project board.') } finally { setIsLoading(false) }
  }, [projectId])

  useEffect(() => {
    if (!projectId) return
    void loadBoard()
    getProject(projectId).then((response) => setProjectName(response.project.name)).catch(() => undefined)
  }, [projectId, loadBoard])

  useEffect(() => {
    const refreshBoard = () => void loadBoard()
    window.addEventListener('ticket-created', refreshBoard)
    return () => window.removeEventListener('ticket-created', refreshBoard)
  }, [loadBoard])

  function statusOptionsFor(ticket: Ticket) {
    const currentStatusId = String(ticket.current_status_id || '')
    const transitionTargets = workflowTransitions.filter((transition) => transition.from_status_ids.includes(currentStatusId)).map((transition) => transition.to_status_id)
    return (board?.columns || []).filter((column) => column.status_id === currentStatusId || transitionTargets.includes(column.status_id))
  }

  async function moveToStatus(ticket: Ticket, targetStatusId: string) {
    if (!targetStatusId || targetStatusId === ticket.current_status_id) return
    setError('')
    const graphTransition = workflowTransitions.find((transition) => transition.to_status_id === targetStatusId && transition.from_status_ids.includes(String(ticket.current_status_id)))
    if (!graphTransition) { setError(`No configured transition exists from "${ticket.current_status_name || 'the current status'}" to that status.`); return }
    setMovingTicketId(ticket._id)
    try {
      const response = await getTicketTransitions(ticket._id)
      const target = response.transitions.find((transition) => transition._id === graphTransition._id || transition.to_status_id === targetStatusId)
      if (!target) throw new Error('No workflow transition exists for this status.')
      if (!target.available) throw new Error(target.blocked_reason || 'You cannot use this transition.')
      await executeTicketTransition(ticket._id, target._id)
      await loadBoard()
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to move ticket.') } finally { setMovingTicketId(''); setDraggedTicket(null) }
  }

  async function assignToMember(ticket: Ticket, agentId: string) {
    if (agentId === ticket.assigned_agent) return
    setAssigningTicketId(ticket._id)
    setError('')
    try {
      await assignTicket(ticket._id, agentId)
      await loadBoard()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to assign ticket.')
    } finally {
      setAssigningTicketId('')
    }
  }

  function openEditor(ticket: Ticket) {
    setError('')
    setEditingTicket(ticket)
    setEditDraft({ title: ticket.title, description: ticket.description || '', priority: ticket.priority })
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingTicket) return
    setIsSavingEdit(true)
    setError('')
    try { await updateTicket(editingTicket._id, editDraft); setEditingTicket(null); await loadBoard() } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to update ticket.') } finally { setIsSavingEdit(false) }
  }

  async function removeTicket(ticket: Ticket) {
    if (!window.confirm(`Delete ${ticket.ticket_code}?`)) return
    setError('')
    try { await deleteTicket(ticket._id); await loadBoard() } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to delete ticket.') }
  }

  async function setupLinearWorkflow() {
    if (!projectId || !board || board.columns.length < 2) return
    setIsConfiguringWorkflow(true)
    setError('')
    try { await configureLinearWorkflow(projectId, board.columns); await loadBoard() } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to configure the project workflow.') } finally { setIsConfiguringWorkflow(false) }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>, column: BoardColumn) {
    event.preventDefault()
    if (draggedTicket && draggedTicket.current_status_id !== column.status_id) void moveToStatus(draggedTicket, column.status_id)
  }

  if (isLoading) return <div className="page-content"><div className="panel loading-state"><span className="spinner" />Loading project board...</div></div>
  if (!board) return <div className="page-content"><div className="inline-error"><span>{error || 'Project board not found.'}</span><Link to="/projects">Back to projects</Link></div></div>

  const laneCount = Math.min(4, board.columns.length)
  const workflowLanes = Array.from({ length: laneCount }, (_, laneIndex) => board.columns.filter((_, columnIndex) => columnIndex % laneCount === laneIndex))

  return <div className="page-content workflow-page">
    <div className="ticket-breadcrumb"><Link to="/projects">Projects</Link><span>/</span><Link to={`/projects/${projectId}`}>{projectName}</Link><span>/</span><span>Board</span></div>
    <div className="project-tabs"><Link to={`/projects/${projectId}`}>Summary</Link><Link className="active" to={`/projects/${projectId}/board`}>Board</Link><Link to={`/tickets?project=${projectId}`}>Tickets</Link><span>Reports</span><span>＋</span></div>
    <section className="workflow-heading"><div><div className="project-title"><span className="project-title-icon">{projectName.slice(0, 1).toUpperCase()}</span><div><p className="eyebrow">Project workspace</p><h1>{projectName}</h1></div></div><p className="subtle">Plan, track, and move work through your project workflow.</p></div><div className="workflow-actions"><Link className="secondary-button" to={`/projects/${projectId}`}>Project overview</Link><button className="primary-button" type="button" onClick={() => openCreateTicket({ projectId })}>＋ Create</button></div></section>
    {error && <div className="inline-error"><span>{error}</span><button onClick={() => void loadBoard()}>Try again</button></div>}
    {workflowTransitions.length === 0 && board.columns.length > 1 && <div className="workflow-setup-notice"><div><strong>This project has no workflow transitions yet.</strong><p>The statuses are available, but tickets cannot move until transitions are configured.</p></div><button type="button" className="primary-button" onClick={() => void setupLinearWorkflow()} disabled={isConfiguringWorkflow}>{isConfiguringWorkflow ? 'Setting up...' : 'Set up linear workflow'}</button></div>}
    <div className="board-toolbar"><label className="board-search"><span>⌕</span><input placeholder="Search board" aria-label="Search board" /></label><button className="board-filter">☷ Filter</button><button className="board-filter">▱ Group</button><span className="board-scope">{board.scope === 'sprint' ? 'Active sprint' : 'Backlog'} · {board.columns.reduce((total, column) => total + column.tickets.length, 0)} tickets</span></div>
    <section className="workflow-board">{workflowLanes.map((lane, laneIndex) => <div className="workflow-lane" key={`lane-${laneIndex}`}>{lane.map((column, columnIndex) => <div className={`workflow-column workflow-column-${(laneIndex + columnIndex * laneCount) % 8}`} key={column.status_id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, column)}><div className="workflow-column-header"><h2>{column.status_name}</h2><span>{column.tickets.length}</span></div><div className="workflow-column-body">{column.tickets.map((ticket) => <BoardTicket key={ticket._id} ticket={ticket} statusOptions={statusOptionsFor(ticket)} members={projectMembers} onDragStart={setDraggedTicket} onMove={(selected, statusId) => void moveToStatus(selected, statusId)} onAssign={(selected, agentId) => void assignToMember(selected, agentId)} onEdit={openEditor} onDelete={(selected) => void removeTicket(selected)} isBusy={movingTicketId === ticket._id || assigningTicketId === ticket._id} />)}{column.tickets.length === 0 && <div className="empty-column">Drop tickets here</div>}</div></div>)}</div>)}</section>
    {editingTicket && <div className="board-modal-backdrop" role="presentation" onMouseDown={() => setEditingTicket(null)}><form className="board-edit-modal" onSubmit={(event) => void saveEdit(event)} onMouseDown={(event) => event.stopPropagation()}><div className="board-modal-header"><div><span className="eyebrow">{editingTicket.ticket_code}</span><h2>Edit ticket</h2></div><button type="button" className="board-modal-close" onClick={() => setEditingTicket(null)}>×</button></div><label>Title<input value={editDraft.title} onChange={(event) => setEditDraft((draft) => ({ ...draft, title: event.target.value }))} required maxLength={255} /></label><label>Description<textarea value={editDraft.description} onChange={(event) => setEditDraft((draft) => ({ ...draft, description: event.target.value }))} rows={5} maxLength={10000} /></label><label>Priority<select value={editDraft.priority} onChange={(event) => setEditDraft((draft) => ({ ...draft, priority: event.target.value as TicketPriority }))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><div className="board-modal-actions"><button type="button" className="secondary-button" onClick={() => setEditingTicket(null)}>Cancel</button><button type="submit" className="primary-button" disabled={isSavingEdit}>{isSavingEdit ? 'Saving...' : 'Save changes'}</button></div></form></div>}
  </div>
}
