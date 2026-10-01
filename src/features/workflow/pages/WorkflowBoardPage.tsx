import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProject } from '../../projects/api/projectApi'
import { configureLinearWorkflow, executeTicketTransition, getProjectBoard, getProjectWorkflow, getTicketTransitions } from '../api/workflowApi'
import type { BoardColumn, ProjectBoard, ProjectWorkflowTransition, TicketTransition } from '../types/workflow.types'
import type { Ticket } from '../../tickets/types/ticket.types'
import './workflow-board.css'
import './workflow-setup.css'

function priorityLabel(priority: string) { return priority.charAt(0).toUpperCase() + priority.slice(1) }

function BoardTicket({ ticket, onDragStart, onMoveClick, isBusy }: { ticket: Ticket; onDragStart: (ticket: Ticket) => void; onMoveClick: (ticket: Ticket) => void; isBusy: boolean }) {
  return <article className={`board-ticket ${isBusy ? 'is-moving' : ''}`} draggable={!isBusy} onDragStart={() => onDragStart(ticket)}>
    <div className="board-ticket-top"><span className="board-ticket-code">{ticket.ticket_code}</span><button className="ticket-more" onClick={() => onMoveClick(ticket)} aria-label={`Move ${ticket.ticket_code}`}>•••</button></div>
    <h3>{ticket.title}</h3>
    <div className="board-ticket-bottom"><span className={`board-priority ${ticket.priority}`}>{priorityLabel(ticket.priority)}</span>{ticket.issue_type && <span className="board-issue-type">{ticket.issue_type}</span>}<button className="move-ticket-button" onClick={() => onMoveClick(ticket)}>Move</button></div>
  </article>
}

function MoveMenu({ transitions, onMove, onClose }: { transitions: TicketTransition[]; onMove: (transition: TicketTransition) => void; onClose: () => void }) {
  return <div className="move-menu"><div className="move-menu-header"><strong>Move ticket to</strong><button onClick={onClose} aria-label="Close move menu">×</button></div>{transitions.length === 0 ? <p className="move-empty">No transitions configured from this status.</p> : transitions.map((transition) => <button className="move-option" key={transition._id} disabled={!transition.available} onClick={() => onMove(transition)}><span>{transition.to_status_name || 'Next status'}</span><small>{transition.available ? transition.name : transition.blocked_reason || 'Unavailable'}</small></button>)}</div>
}

export function WorkflowBoardPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [projectName, setProjectName] = useState('Project')
  const [board, setBoard] = useState<ProjectBoard | null>(null)
  const [workflowTransitions, setWorkflowTransitions] = useState<ProjectWorkflowTransition[]>([])
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null)
  const [movingTicketId, setMovingTicketId] = useState('')
  const [menuTicket, setMenuTicket] = useState<Ticket | null>(null)
  const [menuTransitions, setMenuTransitions] = useState<TicketTransition[]>([])
  const [isLoadingMenu, setIsLoadingMenu] = useState(false)
  const [isConfiguringWorkflow, setIsConfiguringWorkflow] = useState(false)
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
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load the project board.') } finally { setIsLoading(false) }
  }, [projectId])

  useEffect(() => {
    if (!projectId) return
    void loadBoard()
    getProject(projectId).then((response) => setProjectName(response.project.name)).catch(() => undefined)
  }, [projectId, loadBoard])

  async function moveToStatus(ticket: Ticket, targetStatusId: string) {
    setError('')
    const currentStatusId = ticket.current_status_id
    const graphTransition = workflowTransitions.find((transition) => transition.to_status_id === targetStatusId && transition.from_status_ids.includes(String(currentStatusId)))
    if (!graphTransition) {
      const targetColumn = board?.columns.find((column) => column.status_id === targetStatusId)
      setError(`No configured transition exists from "${ticket.current_status_name || 'the current status'}" to "${targetColumn?.status_name || 'that status'}". Configure this transition in the project workflow.`)
      setDraggedTicket(null)
      return
    }
    setMovingTicketId(ticket._id)
    try {
      const response = await getTicketTransitions(ticket._id)
      const target = response.transitions.find((transition) => transition._id === graphTransition._id || transition.to_status_id === targetStatusId)
      if (!target) throw new Error('No workflow transition exists for this status.')
      if (!target.available) throw new Error(target.blocked_reason || 'You cannot use this transition.')
      await executeTicketTransition(ticket._id, target._id)
      setMenuTicket(null)
      await loadBoard()
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to move ticket.') } finally { setMovingTicketId(''); setDraggedTicket(null) }
  }

  async function openMoveMenu(ticket: Ticket) {
    setMenuTicket(ticket)
    setIsLoadingMenu(true)
    setError('')
    try { const response = await getTicketTransitions(ticket._id); setMenuTransitions(response.transitions) } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to load ticket transitions.') } finally { setIsLoadingMenu(false) }
  }

  async function setupLinearWorkflow() {
    if (!projectId || !board || board.columns.length < 2) return
    setIsConfiguringWorkflow(true)
    setError('')
    try {
      await configureLinearWorkflow(projectId, board.columns)
      await loadBoard()
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Unable to configure the project workflow.') } finally { setIsConfiguringWorkflow(false) }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>, column: BoardColumn) {
    event.preventDefault()
    if (draggedTicket && draggedTicket.current_status_id !== column.status_id) void moveToStatus(draggedTicket, column.status_id)
  }

  if (isLoading) return <div className="page-content"><div className="panel loading-state"><span className="spinner" />Loading project board...</div></div>
  if (!board) return <div className="page-content"><div className="inline-error"><span>{error || 'Project board not found.'}</span><Link to="/projects">Back to projects</Link></div></div>

  return <div className="page-content workflow-page">
    <div className="ticket-breadcrumb"><Link to="/projects">Projects</Link><span>/</span><Link to={`/projects/${projectId}`}>{projectName}</Link><span>/</span><span>Board</span></div>
    <section className="workflow-heading"><div><p className="eyebrow">{projectName}</p><h1>Project board</h1><p className="subtle">Drag tickets between columns to move them through the configured workflow.</p></div><div className="workflow-actions"><Link className="secondary-button" to={`/projects/${projectId}`}>Project overview</Link><Link className="primary-button" to={`/tickets/new?project=${projectId}`}>＋ Create ticket</Link></div></section>
    {error && <div className="inline-error"><span>{error}</span><button onClick={() => void loadBoard()}>Try again</button></div>}
    {workflowTransitions.length === 0 && board.columns.length > 1 && <div className="workflow-setup-notice"><div><strong>This project has no workflow transitions yet.</strong><p>The statuses are available, but tickets cannot move until transitions are configured in the project workflow.</p></div><button className="primary-button" onClick={() => void setupLinearWorkflow()} disabled={isConfiguringWorkflow}>{isConfiguringWorkflow ? 'Setting up...' : 'Set up linear workflow'}</button></div>}
    <div className="workflow-help"><span className="drag-hint">⠿</span><span>Move a ticket by dragging it to another status. The backend checks the project workflow and your permissions.</span><span className="board-scope">{board.scope === 'sprint' ? 'Active sprint' : 'Backlog'} · {board.columns.reduce((total, column) => total + column.tickets.length, 0)} tickets</span></div>
    <section className="workflow-board">{board.columns.map((column) => { const dropAllowed = !draggedTicket || draggedTicket.current_status_id === column.status_id || workflowTransitions.some((transition) => transition.to_status_id === column.status_id && transition.from_status_ids.includes(String(draggedTicket.current_status_id))); return <div className={`workflow-column ${!dropAllowed ? 'drop-disabled' : ''}`} key={column.status_id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => handleDrop(event, column)}><div className="workflow-column-header"><h2>{column.status_name}</h2><span>{column.tickets.length}</span></div><div className="workflow-column-body">{column.tickets.map((ticket) => <div className="board-ticket-wrap" key={ticket._id}><BoardTicket ticket={ticket} onDragStart={setDraggedTicket} onMoveClick={(selected) => void openMoveMenu(selected)} isBusy={movingTicketId === ticket._id} />{menuTicket?._id === ticket._id && <MoveMenu transitions={isLoadingMenu ? [] : menuTransitions} onMove={(transition) => void moveToStatus(ticket, transition.to_status_id)} onClose={() => setMenuTicket(null)} />}</div>)}{column.tickets.length === 0 && <div className="empty-column">{dropAllowed ? 'Drop tickets here' : 'No transition available'}</div>}</div></div> })}</section>
  </div>
}
