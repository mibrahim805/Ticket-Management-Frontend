import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TicketTable } from '../../tickets/components/TicketTable'
import { addProjectMember, assignProjectStatuses, getProject, getProjectAvailableStatuses, getProjectMemberCandidates, getProjectMembers, getProjectTickets, getProjectTicketSummary, removeProjectMember, updateProjectMemberRole } from '../api/projectApi'
import type { ProjectTicketSummary } from '../api/projectApi'
import type { Project, ProjectMember, ProjectMemberCandidate, ProjectRole, ProjectStatus } from '../types/project.types'
import type { Ticket } from '../../tickets/types/ticket.types'
import { getProjectActivity } from '../../activity/api/activityApi'
import type { ActivityEvent } from '../../activity/types/activity.types'
import '../components/projects.css'

export function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketSummary, setTicketSummary] = useState<ProjectTicketSummary>({})
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
  const [activities, setActivities] = useState<ActivityEvent[]>([])

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
        const [ticketResponse, summaryResponse] = await Promise.all([
          getProjectTickets(projectResponse.project.code),
          getProjectTicketSummary(projectResponse.project._id).catch(() => ({})),
        ])
        if (!cancelled) {
          setTickets(ticketResponse.data)
          setTicketSummary(summaryResponse)
        }
        if (!cancelled) void loadMembers(projectResponse.project._id)
        if (!cancelled) void loadStatuses(projectResponse.project._id, projectResponse.project.assigned_statuses)
        if (!cancelled) void getProjectActivity(projectResponse.project._id).then((response) => { if (!cancelled) setActivities(response.activities) }).catch(() => undefined)
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
  const fallbackInProgress = tickets.filter((ticket) => ticket.current_status_name?.toLowerCase().includes('progress')).length
  const fallbackCompleted = tickets.filter((ticket) => ['done', 'closed', 'resolved'].some((status) => ticket.current_status_name?.toLowerCase().includes(status))).length
  const totalTickets = ticketSummary.total_tickets ?? project.total_tickets
  const inProgress = ticketSummary.in_progress_tickets ?? fallbackInProgress
  const completed = (ticketSummary.resolved_tickets ?? 0) + (ticketSummary.closed_tickets ?? fallbackCompleted)
  const openTickets = ticketSummary.open_tickets ?? Math.max(totalTickets - inProgress - completed, 0)
  const onHold = ticketSummary.on_hold_tickets ?? 0
  const overdue = ticketSummary.overdue_tickets ?? tickets.filter((ticket) => ticket.is_overdue).length
  const completion = totalTickets ? Math.round((completed / totalTickets) * 100) : 0
  const bugTickets = ticketSummary.bug_tickets ?? tickets.filter((ticket) => ticket.issue_type === 'bug').length
  const taskTickets = ticketSummary.task_tickets ?? tickets.filter((ticket) => ticket.issue_type === 'task' || ticket.issue_type === 'subtask').length
  const storyTickets = ticketSummary.story_tickets ?? tickets.filter((ticket) => ticket.issue_type === 'story').length
  const epicTickets = ticketSummary.epic_tickets ?? tickets.filter((ticket) => ticket.issue_type === 'epic').length
  const percent = (value: number) => totalTickets ? (value / totalTickets) * 100 : 0
  const bugEnd = percent(bugTickets)
  const taskEnd = bugEnd + percent(taskTickets)
  const storyEnd = taskEnd + percent(storyTickets)
  const epicEnd = Math.min(storyEnd + percent(epicTickets), 100)
  const donutBackground = totalTickets
    ? `conic-gradient(#f0526b 0 ${bugEnd}%, #635bdf ${bugEnd}% ${taskEnd}%, #f4a340 ${taskEnd}% ${storyEnd}%, #25a77a ${storyEnd}% ${epicEnd}%, #e8edf5 ${epicEnd}% 100%)`
    : '#e8edf5'
  const createdLabel = project.created_at ? new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date(project.created_at)) : 'Active project'
  return <div className="page-content project-page project-dashboard-page">
    <div className="ticket-breadcrumb"><Link to="/projects">Projects</Link><span>/</span><span>{project.code}</span></div>
    <section className="project-hero project-reference-hero project-dashboard-hero">
      <div className="project-hero-identity"><span className="project-hero-icon" aria-hidden="true">{initials}</span><div><div className="project-reference-title"><h1>{project.name}</h1><span className="project-active-badge"><i />Active</span></div><p className="subtle">Plan, track, and deliver work for the {project.code} team.</p><div className="project-hero-meta"><span>{project.code}</span><span>{createdLabel}</span><span>{members.length} {members.length === 1 ? 'member' : 'members'}</span></div></div></div>
      <div className="project-hero-actions"><Link className="secondary-button project-settings-button" to={`/projects/${project._id}/settings`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V21h-4v-.08A1.7 1.7 0 0 0 8.95 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.58 15 1.7 1.7 0 0 0 3 14H3v-4h.08A1.7 1.7 0 0 0 4.6 8.95a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.58 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15.05 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.42 9 1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z"/></svg>Settings</Link><Link className="primary-button project-create-ticket" to={`/tickets/new?project=${project._id}`}><span aria-hidden="true">＋</span>Create ticket</Link></div>
    </section>
    <nav className="project-detail-tabs" aria-label="Project sections"><a className="active" href="#overview">Overview</a><a href="#issues">Issues</a><a href={`/projects/${project._id}/board`}>Sprints</a><Link to="/analytics">Reports</Link></nav>
    <section className="project-summary-strip" aria-label="Project summary">
      <article><span className="summary-icon total" aria-hidden="true">◫</span><div><small>Total issues</small><strong>{totalTickets}</strong><p>Across this project</p></div></article>
      <article><span className="summary-icon progress" aria-hidden="true">↗</span><div><small>In progress</small><strong>{inProgress}</strong><p>Currently moving</p></div></article>
      <article><span className="summary-icon complete" aria-hidden="true">✓</span><div><small>Completed</small><strong>{completed}</strong><p>{completion}% completion rate</p></div></article>
      <article className={overdue > 0 ? 'has-alert' : ''}><span className="summary-icon overdue" aria-hidden="true">!</span><div><small>Overdue</small><strong>{overdue}</strong><p>{overdue > 0 ? 'Needs attention' : 'Everything on track'}</p></div></article>
    </section>
    <section className="project-overview-grid" id="overview">
      <article className="panel sprint-panel"><div className="reference-panel-heading"><div><span className="panel-eyebrow">Delivery</span><h2>Project progress</h2><p>{completed} of {totalTickets} issues completed</p></div><Link to={`/projects/${project._id}/board`}>Open board <span aria-hidden="true">→</span></Link></div><div className="progress-overview"><div><strong>{completion}%</strong><span>complete</span></div><div className="progress-track"><span style={{ width: `${completion}%` }} /></div></div><div className="sprint-stats"><div><span className="status-dot todo" /><small>To do</small><strong>{openTickets}</strong></div><div><span className="status-dot doing" /><small>In progress</small><strong>{inProgress}</strong></div><div><span className="status-dot hold" /><small>On hold</small><strong>{onHold}</strong></div><div><span className="status-dot done" /><small>Done</small><strong>{completed}</strong></div></div></article>
      <article className="panel breakdown-panel"><div className="reference-panel-heading"><div><span className="panel-eyebrow">Work mix</span><h2>Issue types</h2><p>How work is distributed</p></div></div><div className="breakdown-content"><div className="donut-chart" style={{ background: donutBackground }}><span><strong>{totalTickets}</strong><small>Total issues</small></span></div><div className="breakdown-legend"><span><i className="legend-bug" />Bugs <b>{bugTickets}</b></span><span><i className="legend-task" />Tasks <b>{taskTickets}</b></span><span><i className="legend-story" />Stories <b>{storyTickets}</b></span><span><i className="legend-epic" />Epics <b>{epicTickets}</b></span></div></div></article>
    </section>
    <section className="project-detail-lower-grid" id="issues"><article className="panel recent-issues-panel"><div className="reference-panel-heading"><div><span className="panel-eyebrow">Latest activity</span><h2>Recent issues</h2><p>The five most recently created issues</p></div><Link to={`/tickets?project=${project.code}`}>View all issues <span aria-hidden="true">→</span></Link></div><TicketTable tickets={tickets} /></article><aside className="panel project-shortcuts-panel"><div className="reference-panel-heading"><div><span className="panel-eyebrow">Navigate</span><h2>Quick links</h2><p>Jump back into project work</p></div></div><nav aria-label="Project quick links"><Link to={`/projects/${project._id}/board`}><span className="shortcut-icon board" aria-hidden="true">▦</span><span><strong>Sprint board</strong><small>Plan and move active work</small></span><b aria-hidden="true">›</b></Link><Link to={`/tickets?project=${project.code}`}><span className="shortcut-icon issues" aria-hidden="true">☷</span><span><strong>All issues</strong><small>Search and filter {totalTickets} tickets</small></span><b aria-hidden="true">›</b></Link><Link to="/analytics"><span className="shortcut-icon reports" aria-hidden="true">⌁</span><span><strong>Reports</strong><small>Review delivery trends</small></span><b aria-hidden="true">›</b></Link></nav><div className="project-attention"><span><i className={overdue > 0 ? 'warning' : 'healthy'} />Project health</span><strong>{overdue > 0 ? `${overdue} overdue ${overdue === 1 ? 'issue' : 'issues'}` : 'On track'}</strong><small>{ticketSummary.urgent_priority_tickets || 0} urgent priority</small></div></aside></section>
    <details className="project-admin-details">
      <summary><span><strong>Project administration</strong><small>Statuses and activity</small></span></summary>
      {statusAccessChecked && (availableStatuses.length > 0 || statusError) && <section className="panel project-status-panel" id="statuses"><div className="reference-panel-heading"><div><h2>Project statuses</h2><p>Choose the statuses available in this project.</p></div>{availableStatuses.length > 0 && <span className="status-count">{selectedStatusIds.length} selected</span>}</div>{statusError && <div className="members-message members-error">{statusError}</div>}{statusMessage && <div className="members-message members-success">{statusMessage}</div>}{availableStatuses.length > 0 && <><div className="status-assignment-list">{availableStatuses.map((status) => <label className="status-assignment-row" key={status._id}><input type="checkbox" checked={selectedStatusIds.includes(status._id)} onChange={() => toggleStatus(status._id)} /><span className="status-order">{status.order}</span><span><strong>{status.name}</strong><small>{selectedStatusIds.includes(status._id) ? 'Available in this project' : 'Not assigned'}</small></span></label>)}</div>{availableStatuses.some((status) => project.assigned_statuses.includes(status._id) && !selectedStatusIds.includes(status._id)) && <div className="status-migrations"><h3>Move existing tickets</h3><p>Choose where tickets should move when removing a status.</p>{availableStatuses.filter((status) => project.assigned_statuses.includes(status._id) && !selectedStatusIds.includes(status._id)).map((status) => <label key={status._id}>{status.name}<select value={statusMigrations[status._id] || ''} onChange={(event) => setStatusMigrations((current) => ({ ...current, [status._id]: event.target.value }))}><option value="">Select replacement status</option>{availableStatuses.filter((target) => target._id !== status._id && selectedStatusIds.includes(target._id)).map((target) => <option value={target._id} key={target._id}>{target.name}</option>)}</select></label>)}</div>}<button className="primary-button status-save-button" type="button" disabled={isSavingStatuses} onClick={() => void saveStatuses()}>{isSavingStatuses ? 'Saving...' : 'Save statuses'}</button></>}</section>}
    </details>
    <section className="panel project-members-panel" id="members"><div className="reference-panel-heading"><div><h2>Project members</h2><p>Assign users and choose their project role.</p></div><span className="member-count">{members.length} members</span></div>{membersError && <div className="members-message members-error">{membersError}</div>}{membersMessage && <div className="members-message members-success">{membersMessage}</div>}<div className="member-management-grid"><div className="member-assign-box"><h3>Assign a user</h3>{memberCandidates.length ? <><label>User<select value={selectedMember} onChange={(event) => setSelectedMember(event.target.value)}><option value="">Select a user</option>{memberCandidates.map((candidate) => <option value={candidate.user_id} key={candidate.user_id}>{candidate.name} · {candidate.email}</option>)}</select></label><label>Project role<select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as ProjectRole)}><option value="member">Member</option><option value="reporter">Reporter</option><option value="lead">Lead</option></select></label><button className="primary-button" type="button" disabled={!selectedMember || isAddingMember} onClick={() => void addMember()}>{isAddingMember ? 'Assigning...' : 'Assign to project'}</button></> : <p className="member-assign-help">Only project leads and super admins can assign users. There are no available active users to add.</p>}</div><div className="member-list">{membersLoading ? <div className="members-empty">Loading members...</div> : members.length ? members.map((member) => <div className="member-row" key={member.user_id}><div className="member-avatar">{member.name.slice(0, 2).toUpperCase()}</div><div className="member-identity"><strong>{member.name}</strong><small>{member.email}</small></div><select value={member.role} onChange={(event) => void changeMemberRole(member, event.target.value as ProjectRole)} aria-label={`Project role for ${member.name}`}><option value="member">Member</option><option value="reporter">Reporter</option><option value="lead">Lead</option></select><button className="member-remove" type="button" onClick={() => void removeMember(member)}>Remove</button></div>) : <div className="members-empty">No members found.</div>}</div></div></section>
    <details className="project-admin-details project-activity-details">
      <summary><span><strong>Project activity</strong><small>Recent project configuration and membership changes</small></span></summary>
      <section className="panel project-activity-panel" id="activity"><div className="reference-panel-heading"><div><h2>Project activity</h2><p>Recent project configuration and membership changes.</p></div><span className="status-count">{activities.length}</span></div>{activities.length ? <div className="project-activity-list">{activities.slice(0, 10).map((activity) => <div className="project-activity-row" key={activity._id}><span className="activity-icon">↗</span><div><strong>{activity.action.replaceAll('_', ' ')}</strong><small>{activity.changed_by ? `Changed by ${activity.changed_by}` : 'Project activity'}{activity.changed_at ? ` · ${new Date(activity.changed_at).toLocaleString()}` : ''}</small></div></div>)}</div> : <p className="members-empty">No project activity recorded.</p>}</section>
    </details>
  </div>
}
