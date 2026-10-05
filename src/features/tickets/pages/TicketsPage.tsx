import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProjectMembers } from '../../projects/api/projectApi'
import { useProjects } from '../../projects/hooks/useProjects'
import { TicketTable } from '../components/TicketTable'
import { assignTicket, bulkAssignTickets, bulkTransitionTickets } from '../api/ticketApi'
import { getTicketTransitions } from '../../workflow/api/workflowApi'
import type { TicketTransition } from '../../workflow/types/workflow.types'
import { useTickets } from '../hooks/useTickets'
import type { Ticket, TicketCategory, TicketFilters, TicketIssueType, TicketPriority } from '../types/ticket.types'
import type { ProjectMember } from '../../projects/types/project.types'
import './tickets.css'

const initialFilters: TicketFilters = { page: 1, page_size: 10, search: '', priority: '', category: '', issue_type: '', overdue_only: false, sort_by: 'created_at', sort_order: 'desc' }

export function TicketsPage() {
  const [searchParams] = useSearchParams()
  const projectKey = searchParams.get('project') ?? ''
  const searchQuery = searchParams.get('search') ?? ''
  const [filters, setFilters] = useState(() => ({ ...initialFilters, project_key: projectKey, search: searchQuery }))
  const { tickets, pagination, isLoading, error, reload } = useTickets(filters)
  const { projects } = useProjects()
  const [membersByProject, setMembersByProject] = useState<Record<string, ProjectMember[]>>({})
  const [assigningTicketId, setAssigningTicketId] = useState('')
  const [assignmentError, setAssignmentError] = useState('')
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([])
  const [bulkAssignee, setBulkAssignee] = useState('')
  const [bulkTransitionId, setBulkTransitionId] = useState('')
  const [bulkTransitions, setBulkTransitions] = useState<TicketTransition[]>([])
  const [bulkBusy, setBulkBusy] = useState('')
  const update = <K extends keyof TicketFilters>(field: K, value: TicketFilters[K]) => setFilters((current) => ({ ...current, [field]: value, ...(field !== 'page' && { page: 1 }) }))
  const selectedTickets = useMemo(() => tickets.filter((ticket) => selectedTicketIds.includes(ticket._id)), [selectedTicketIds, tickets])
  const bulkProjectKey = selectedTickets.length > 0 && selectedTickets.every((ticket) => ticket.project_key === selectedTickets[0].project_key) ? selectedTickets[0].project_key : ''
  const bulkMembers = (membersByProject[bulkProjectKey] || []).filter((member) => (member.role === 'lead' || member.role === 'member') && !member.suspended)

  useEffect(() => {
    setFilters((current) => current.project_key === projectKey && current.search === searchQuery ? current : { ...current, project_key: projectKey, search: searchQuery, page: 1 })
  }, [projectKey, searchQuery])

  useEffect(() => {
    const visibleProjects = projectKey ? projects.filter((project) => project.code === projectKey) : projects
    if (!visibleProjects.length) return
    let cancelled = false
    void Promise.all(visibleProjects.map(async (project) => [project.code, await getProjectMembers(project._id).catch(() => [])] as const)).then((entries) => {
      if (!cancelled) setMembersByProject(Object.fromEntries(entries))
    })
    return () => { cancelled = true }
  }, [projects, projectKey])

  useEffect(() => {
    setSelectedTicketIds((current) => current.filter((id) => tickets.some((ticket) => ticket._id === id)))
  }, [tickets])

  useEffect(() => {
    setBulkTransitions([])
    setBulkTransitionId('')
    if (!bulkProjectKey || !selectedTickets.length) return
    let cancelled = false
    void getTicketTransitions(selectedTickets[0]._id).then((response) => {
      if (!cancelled) setBulkTransitions(response.transitions.filter((transition) => transition.available))
    }).catch(() => undefined)
    return () => { cancelled = true }
  }, [bulkProjectKey, selectedTickets])

  async function handleAssign(ticket: Ticket, agentId: string) {
    setAssigningTicketId(ticket._id)
    setAssignmentError('')
    try {
      await assignTicket(ticket._id, agentId)
      await reload()
    } catch (requestError) {
      setAssignmentError(requestError instanceof Error ? requestError.message : 'Unable to assign ticket.')
    } finally {
      setAssigningTicketId('')
    }
  }

  async function handleBulkAssign() {
    if (!bulkAssignee || !selectedTicketIds.length) return
    setBulkBusy('assign')
    setAssignmentError('')
    try {
      const response = await bulkAssignTickets(selectedTicketIds, bulkAssignee)
      setAssignmentError(response.failed.length ? `${response.succeeded.length} assigned; ${response.failed.length} failed.` : `${response.succeeded.length} tickets assigned.`)
      setSelectedTicketIds([])
      await reload()
    } catch (requestError) { setAssignmentError(requestError instanceof Error ? requestError.message : 'Unable to bulk assign tickets.') } finally { setBulkBusy('') }
  }

  async function handleBulkTransition() {
    if (!bulkTransitionId || !selectedTicketIds.length) return
    setBulkBusy('transition')
    setAssignmentError('')
    try {
      const response = await bulkTransitionTickets(selectedTicketIds, bulkTransitionId)
      setAssignmentError(response.failed.length ? `${response.succeeded.length} transitioned; ${response.failed.length} failed.` : `${response.succeeded.length} tickets transitioned.`)
      setSelectedTicketIds([])
      await reload()
    } catch (requestError) { setAssignmentError(requestError instanceof Error ? requestError.message : 'Unable to bulk transition tickets.') } finally { setBulkBusy('') }
  }

  return <div className="page-content tickets-page">
    <section className="page-heading"><div><p className="eyebrow">{projectKey ? `Project ${projectKey}` : 'Workspace'}</p><h1>{projectKey ? `${projectKey} tickets` : 'Tickets'}</h1><p className="subtle">Search and manage tickets across your accessible projects.</p></div><Link className="primary-button" to="/tickets/new">＋ Create ticket</Link></section>
    <section className="ticket-filters panel">
      <div className="ticket-search"><span>⌕</span><input value={filters.search} onChange={(event) => update('search', event.target.value)} placeholder="Search by ticket key, title, or description" /></div>
      <div className="filter-row"><label>Priority<select value={filters.priority} onChange={(event) => update('priority', event.target.value as TicketPriority | '')}><option value="">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label><label>Category<select value={filters.category} onChange={(event) => update('category', event.target.value as TicketCategory | '')}><option value="">All categories</option><option value="bug">Bug</option><option value="feature_request">Feature request</option><option value="support">Support</option></select></label><label>Issue type<select value={filters.issue_type} onChange={(event) => update('issue_type', event.target.value as TicketIssueType | '')}><option value="">All types</option><option value="task">Task</option><option value="bug">Bug</option><option value="story">Story</option><option value="epic">Epic</option><option value="subtask">Subtask</option></select></label><label>Sort by<select value={filters.sort_by} onChange={(event) => update('sort_by', event.target.value as TicketFilters['sort_by'])}><option value="created_at">Created date</option><option value="priority">Priority</option><option value="due_date">Due date</option></select></label><label className="sort-direction"><span>Order</span><button type="button" className="order-button" onClick={() => update('sort_order', filters.sort_order === 'desc' ? 'asc' : 'desc')}>{filters.sort_order === 'desc' ? 'Newest first ↓' : 'Oldest first ↑'}</button></label><label className="overdue-filter"><input type="checkbox" checked={filters.overdue_only} onChange={(event) => update('overdue_only', event.target.checked)} />Overdue only</label></div>
    </section>
    <div className="tickets-toolbar"><span>{isLoading ? 'Loading tickets...' : `${pagination.total} ${pagination.total === 1 ? 'ticket' : 'tickets'}`}</span><button className="refresh-button" onClick={() => void reload()} disabled={isLoading}>↻ Refresh</button></div>
    {selectedTicketIds.length > 0 && <section className="bulk-ticket-toolbar panel"><strong>{selectedTicketIds.length} selected</strong>{bulkProjectKey ? <><label>Assign to<select value={bulkAssignee} onChange={(event) => setBulkAssignee(event.target.value)}><option value="">Select member</option>{bulkMembers.map((member) => <option value={member.user_id} key={member.user_id}>{member.name}</option>)}</select></label><button className="secondary-button" type="button" disabled={!bulkAssignee || bulkBusy === 'assign'} onClick={() => void handleBulkAssign()}>{bulkBusy === 'assign' ? 'Assigning...' : 'Bulk assign'}</button><label>Transition<select value={bulkTransitionId} onChange={(event) => setBulkTransitionId(event.target.value)}><option value="">Select transition</option>{bulkTransitions.map((transition) => <option value={transition._id} key={transition._id}>{transition.name}</option>)}</select></label><button className="secondary-button" type="button" disabled={!bulkTransitionId || bulkBusy === 'transition'} onClick={() => void handleBulkTransition()}>{bulkBusy === 'transition' ? 'Moving...' : 'Bulk transition'}</button></> : <span className="bulk-help">Select tickets from the same project to use bulk actions.</span>}<button className="text-button muted" type="button" onClick={() => setSelectedTicketIds([])}>Clear</button></section>}
    {error && <div className="inline-error"><span>{error}</span><button onClick={() => void reload()}>Try again</button></div>}
    {assignmentError && <div className="inline-error"><span>{assignmentError}</span></div>}
    {isLoading ? <div className="panel loading-state"><span className="spinner" />Loading tickets...</div> : <TicketTable tickets={tickets} membersByProject={membersByProject} onAssign={(ticket, agentId) => void handleAssign(ticket, agentId)} assigningTicketId={assigningTicketId} selectedTicketIds={selectedTicketIds} onToggleSelect={(ticketId) => setSelectedTicketIds((current) => current.includes(ticketId) ? current.filter((id) => id !== ticketId) : [...current, ticketId])} />}
    {pagination.total_pages > 1 && <div className="pagination"><button disabled={!pagination.has_prev} onClick={() => update('page', filters.page - 1)}>← Previous</button><span>Page {pagination.page} of {pagination.total_pages}</span><button disabled={!pagination.has_next} onClick={() => update('page', filters.page + 1)}>Next →</button></div>}
  </div>
}
