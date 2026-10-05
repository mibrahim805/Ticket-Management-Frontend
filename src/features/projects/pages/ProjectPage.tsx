import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TicketTable } from '../../tickets/components/TicketTable'
import { addProjectMember, assignProjectStatuses, getProject, getProjectAvailableStatuses, getProjectMemberCandidates, getProjectMembers, getProjectTickets, removeProjectMember, updateProjectMemberRole } from '../api/projectApi'
import type { Project, ProjectMember, ProjectMemberCandidate, ProjectRole, ProjectStatus } from '../types/project.types'
import type { Ticket } from '../../tickets/types/ticket.types'
import '../components/projects.css'

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [memberCandidates, setMemberCandidates] = useState<ProjectMemberCandidate[]>([])
  const [selectedMember, setSelectedMember] = useState('')
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('member')
  const [membersLoading, setMembersLoading] = useState(true)
  const [membersError, setMembersError] = useState('')
  const [membersMessage, setMembersMessage] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [availableStatuses, setAvailableStatuses] = useState<ProjectStatus[]>([])
  const [selectedStatusIds, setSelectedStatusIds] = useState<string[]>([])
  const [statusMigrations, setStatusMigrations] = useState<Record<string, string>>({})
  const [isSavingStatuses, setIsSavingStatuses] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [statusAccessChecked, setStatusAccessChecked] = useState(false)

  async function loadMembers(id: string) {
    setMembersLoading(true)
    setMembersError('')
    try {
      const projectMembers = await getProjectMembers(id)
      setMembers(projectMembers)
      try {
        setMemberCandidates(await getProjectMemberCandidates(id))
      } catch {
        setMemberCandidates([])
      }
    } catch (requestError) {
      setMembersError(requestError instanceof Error ? requestError.message : 'Unable to load project members.')
    } finally {
      setMembersLoading(false)
    }
  }

  async function loadStatuses(id: string, assignedStatusIds: string[]) {
    try {
      const statuses = await getProjectAvailableStatuses(id)
      setAvailableStatuses(statuses)
      setSelectedStatusIds(assignedStatusIds)
      setStatusError('')
    } catch (requestError) {
      setStatusError(requestError instanceof Error ? requestError.message : 'You do not have permission to configure project statuses.')
    } finally {
      setStatusAccessChecked(true)
    }
  }

  useEffect(() => {
    const id = projectId ?? ''
    if (!id) return
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const projectResponse = await getProject(id)
        if (cancelled) return
        setProject(projectResponse.project)
        const ticketResponse = await getProjectTickets(projectResponse.project.code)
        if (!cancelled) setTickets(ticketResponse.data)
        if (!cancelled) void loadMembers(projectResponse.project._id)
        if (!cancelled) void loadStatuses(projectResponse.project._id, projectResponse.project.assigned_statuses)
      } catch (requestError) {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Unable to load project.')
      } finally { if (!cancelled) setIsLoading(false) }
    }
    void load()
    return () => { cancelled = true }
  }, [projectId])

  async function addMember() {
    if (!project || !selectedMember) return
    setIsAddingMember(true)
    setMembersError('')
    setMembersMessage('')
    try {
      await addProjectMember(project._id, selectedMember, selectedRole)
      setSelectedMember('')
      setMembersMessage('User assigned to this project.')
      await loadMembers(project._id)
    } catch (requestError) {
      setMembersError(requestError instanceof Error ? requestError.message : 'Unable to assign user.')
    } finally {
      setIsAddingMember(false)
    }
  }

  async function changeMemberRole(member: ProjectMember, role: ProjectRole) {
    if (!project) return
    setMembersError('')
    setMembersMessage('')
    try {
      await updateProjectMemberRole(project._id, member.user_id, role)
      setMembersMessage(`${member.name}'s project role was updated.`)
      await loadMembers(project._id)
    } catch (requestError) {
      setMembersError(requestError instanceof Error ? requestError.message : 'Unable to update project role.')
      await loadMembers(project._id)
    }
  }

  async function removeMember(member: ProjectMember) {
    if (!project || !window.confirm(`Remove ${member.name} from this project?`)) return
    setMembersError('')
    setMembersMessage('')
    try {
      await removeProjectMember(project._id, member.user_id)
      setMembersMessage(`${member.name} was removed from this project.`)
      await loadMembers(project._id)
    } catch (requestError) {
      setMembersError(requestError instanceof Error ? requestError.message : 'Unable to remove project member.')
    }
  }

  function toggleStatus(statusId: string) {
    setSelectedStatusIds((current) => current.includes(statusId) ? current.filter((id) => id !== statusId) : [...current, statusId])
    setStatusMigrations((current) => {
      const next = { ...current }
      delete next[statusId]
      return next
    })
  }

  async function saveStatuses() {
    if (!project) return
    setIsSavingStatuses(true)
    setStatusError('')
    setStatusMessage('')
    const originalStatusIds = new Set(project.assigned_statuses)
    const removedStatusIds = [...originalStatusIds].filter((statusId) => !selectedStatusIds.includes(statusId))
    const missingMigration = removedStatusIds.find((statusId) => !statusMigrations[statusId])
    if (selectedStatusIds.length < 2) {
      setStatusError('Select at least two statuses for a project.')
      setIsSavingStatuses(false)
      return
    }
    if (missingMigration) {
      const removedStatus = availableStatuses.find((status) => status._id === missingMigration)
      setStatusError(`Choose a replacement status for removed status "${removedStatus?.name || 'status'}".`)
      setIsSavingStatuses(false)
      return
    }
    try {
      await assignProjectStatuses(project._id, selectedStatusIds, removedStatusIds.map((statusId) => ({ remove_status_id: statusId, move_existing_tickets_to: statusMigrations[statusId] })))
      setProject((current) => current ? { ...current, assigned_statuses: selectedStatusIds } : current)
      setStatusMessage('Project statuses assigned successfully.')
      setStatusMigrations({})
    } catch (requestError) {
      setStatusError(requestError instanceof Error ? requestError.message : 'Unable to assign project statuses.')
    } finally {
      setIsSavingStatuses(false)
    }
  }

  if (isLoading) return <div className="page-content"><div className="panel loading-state"><span className="spinner" />Loading project...</div></div>
  if (error || !project) return <div className="page-content"><div className="inline-error"><span>{error || 'Project not found.'}</span><Link to="/projects">Back to projects</Link></div></div>

  const initials = project.name.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase()
  const inProgress = tickets.filter((ticket) => ticket.current_status_name?.toLowerCase().includes('progress')).length
  const completed = tickets.filter((ticket) => ['done', 'closed', 'resolved'].some((status) => ticket.current_status_name?.toLowerCase().includes(status))).length
  const completion = tickets.length ? Math.round((completed / tickets.length) * 100) : 0
  return <div className="page-content project-page">
    <div className="ticket-breadcrumb"><Link to="/projects">Projects</Link><span>/</span><span>{project.code}</span></div>
    <section className="project-hero project-reference-hero"><div className="project-hero-identity"><span className="project-hero-icon">{initials}</span><div><div className="project-reference-title"><h1>{project.name}</h1><span className="project-active-badge">● Active</span></div><p className="subtle">Project workspace for {project.code} development and maintenance.</p></div></div><Link className="secondary-button" to={`/projects/${project._id}/board`}>⚙ Project settings</Link></section>
    <nav className="project-detail-tabs" aria-label="Project sections"><a className="active" href="#overview">Overview</a><a href="#issues">Issues</a><a href={`/projects/${project._id}/board`}>Sprints</a><a href="#statuses">Statuses</a><a href="#members">Members</a><a href="#reports">Reports</a></nav>
    <section className="project-overview-grid" id="overview">
      <article className="panel sprint-panel"><div className="reference-panel-heading"><div><h2>Current Sprint</h2><p>Sprint 5 · Oct 1 – Oct 14</p></div><Link to={`/projects/${project._id}/board`}>View sprint →</Link></div><div className="progress-track"><span style={{ width: `${Math.max(completion, 12)}%` }} /></div><div className="progress-caption"><strong>{completed} / {tickets.length || project.total_tickets} issues</strong><span>{completion}%</span></div><div className="sprint-stats"><div><small>To do</small><strong>{Math.max(tickets.length - inProgress - completed, 0)}</strong></div><div><small>In progress</small><strong>{inProgress}</strong></div><div><small>In review</small><strong>0</strong></div><div><small>Done</small><strong>{completed}</strong></div></div></article>
      <article className="panel breakdown-panel"><h2>Ticket breakdown</h2><div className="breakdown-content"><div className="donut-chart"><strong>{project.total_tickets}</strong><small>Total issues</small></div><div className="breakdown-legend"><span><i className="legend-bug" />Bug <b>{tickets.filter((ticket) => ticket.category === 'bug').length}</b></span><span><i className="legend-feature" />Feature <b>0</b></span><span><i className="legend-task" />Task <b>{tickets.filter((ticket) => ticket.issue_type === 'task').length}</b></span><span><i className="legend-story" />Story <b>0</b></span></div></div></article>
    </section>
    <section className="project-detail-lower-grid" id="issues"><article className="panel recent-issues-panel"><div className="reference-panel-heading"><h2>Recent issues</h2><Link to={`/tickets?project=${project.code}`}>View all →</Link></div><TicketTable tickets={tickets} /></article><aside className="panel sprint-goals-panel"><h2>Sprint goals</h2><label><input type="checkbox" checked={completed > 0} readOnly /> Complete project integration</label><label><input type="checkbox" readOnly /> Fix authentication flow issues</label><label><input type="checkbox" readOnly /> Update documentation</label><div className="goal-progress"><span>{completed > 0 ? '1/3' : '0/3'} completed</span><div><i style={{ width: `${completed > 0 ? 33 : 0}%` }} /></div></div></aside></section>
    {statusAccessChecked && (availableStatuses.length > 0 || statusError) && <section className="panel project-status-panel" id="statuses"><div className="reference-panel-heading"><div><h2>Project statuses</h2><p>Choose the statuses available in this project.</p></div>{availableStatuses.length > 0 && <span className="status-count">{selectedStatusIds.length} selected</span>}</div>{statusError && <div className="members-message members-error">{statusError}</div>}{statusMessage && <div className="members-message members-success">{statusMessage}</div>}{availableStatuses.length > 0 && <><div className="status-assignment-list">{availableStatuses.map((status) => <label className="status-assignment-row" key={status._id}><input type="checkbox" checked={selectedStatusIds.includes(status._id)} onChange={() => toggleStatus(status._id)} /><span className="status-order">{status.order}</span><span><strong>{status.name}</strong><small>{selectedStatusIds.includes(status._id) ? 'Available in this project' : 'Not assigned'}</small></span></label>)}</div>{availableStatuses.some((status) => project.assigned_statuses.includes(status._id) && !selectedStatusIds.includes(status._id)) && <div className="status-migrations"><h3>Move existing tickets</h3><p>Choose where tickets should move when removing a status.</p>{availableStatuses.filter((status) => project.assigned_statuses.includes(status._id) && !selectedStatusIds.includes(status._id)).map((status) => <label key={status._id}>{status.name}<select value={statusMigrations[status._id] || ''} onChange={(event) => setStatusMigrations((current) => ({ ...current, [status._id]: event.target.value }))}><option value="">Select replacement status</option>{availableStatuses.filter((target) => target._id !== status._id && selectedStatusIds.includes(target._id)).map((target) => <option value={target._id} key={target._id}>{target.name}</option>)}</select></label>)}</div>}<button className="primary-button status-save-button" type="button" disabled={isSavingStatuses} onClick={() => void saveStatuses()}>{isSavingStatuses ? 'Saving...' : 'Save statuses'}</button></>}</section>}
    <section className="panel project-members-panel" id="members"><div className="reference-panel-heading"><div><h2>Project members</h2><p>Assign users and choose their project role.</p></div><span className="member-count">{members.length} members</span></div>{membersError && <div className="members-message members-error">{membersError}</div>}{membersMessage && <div className="members-message members-success">{membersMessage}</div>}<div className="member-management-grid"><div className="member-assign-box"><h3>Assign a user</h3>{memberCandidates.length ? <><label>User<select value={selectedMember} onChange={(event) => setSelectedMember(event.target.value)}><option value="">Select a user</option>{memberCandidates.map((candidate) => <option value={candidate.user_id} key={candidate.user_id}>{candidate.name} · {candidate.email}</option>)}</select></label><label>Project role<select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as ProjectRole)}><option value="member">Member</option><option value="reporter">Reporter</option><option value="lead">Lead</option></select></label><button className="primary-button" type="button" disabled={!selectedMember || isAddingMember} onClick={() => void addMember()}>{isAddingMember ? 'Assigning...' : 'Assign to project'}</button></> : <p className="member-assign-help">Only project leads and super admins can assign users. There are no available active users to add.</p>}</div><div className="member-list">{membersLoading ? <div className="members-empty">Loading members...</div> : members.length ? members.map((member) => <div className="member-row" key={member.user_id}><div className="member-avatar">{member.name.slice(0, 2).toUpperCase()}</div><div className="member-identity"><strong>{member.name}</strong><small>{member.email}</small></div><select value={member.role} onChange={(event) => void changeMemberRole(member, event.target.value as ProjectRole)} aria-label={`Project role for ${member.name}`}><option value="member">Member</option><option value="reporter">Reporter</option><option value="lead">Lead</option></select><button className="member-remove" type="button" onClick={() => void removeMember(member)}>Remove</button></div>) : <div className="members-empty">No members found.</div>}</div></div></section>
  </div>
}
