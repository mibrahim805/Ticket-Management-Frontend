import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  createProjectComponent,
  deleteProject,
  deleteProjectComponent,
  getMyProjectPermissions,
  getProject,
  getProjectAvailableStatuses,
  getProjectCapabilities,
  getProjectComponents,
  getProjectMemberCandidates,
  getProjectMembers,
  getProjectPermissions,
  setProjectMemberSuspension,
  transferProjectLead,
  updateProject,
  updateProjectComponent,
  updateProjectPermissions,
} from '../api/projectApi'
import type { MyProjectPermissions, Project, ProjectCapabilities, ProjectComponent, ProjectMember, ProjectMemberCandidate, ProjectPermissions, ProjectRole, ProjectStatus } from '../types/project.types'
import { addWorkflowTransition, configureProjectWorkflow, deleteWorkflowTransition, editWorkflowTransition, getProjectWorkflow, type WorkflowTransitionInput } from '../../workflow/api/workflowApi'
import type { ProjectWorkflowTransition } from '../../workflow/types/workflow.types'
import { getNotificationPreferences, updateNotificationPreferences } from '../../notifications/api/notificationApi'
import type { NotificationPreferences } from '../../notifications/types/notification.types'
import '../components/project-settings.css'

const roles: ProjectRole[] = ['lead', 'member', 'reporter']
const capabilityLabels: Record<string, string> = {
  view_project: 'View project',
  view_ticket: 'View tickets',
  create_ticket: 'Create tickets',
  update_ticket: 'Update tickets',
  manage_ticket_work: 'Manage ticket work',
  transition_tickets: 'Transition tickets',
  assign_tickets: 'Assign tickets',
  reassign_tickets: 'Reassign tickets',
  link_tickets: 'Link tickets',
  manage_sprints: 'Manage sprints',
  manage_project: 'Manage project',
  view_reports: 'View reports',
  delete_tickets: 'Delete tickets',
  view_internal_comments: 'View internal comments',
  create_internal_comments: 'Create internal comments',
  create_public_comments: 'Create public comments',
  manage_notification_preferences: 'Manage notification preferences',
  view_attachments: 'View attachments',
  upload_attachments: 'Upload attachments',
  delete_attachments: 'Delete attachments',
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function normalizeTransition(transition: ProjectWorkflowTransition): WorkflowTransitionInput {
  return {
    name: transition.name,
    from_status_ids: transition.from_status_ids,
    to_status_id: transition.to_status_id,
    guard: {
      allowed_roles: transition.guard?.allowed_roles?.length ? transition.guard.allowed_roles : ['lead', 'member'],
      requires_assignee: transition.guard?.requires_assignee ?? false,
    },
  }
}

export function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [repositoryUrl, setRepositoryUrl] = useState('')
  const [permissions, setPermissions] = useState<ProjectPermissions | null>(null)
  const [capabilities, setCapabilities] = useState<ProjectCapabilities | null>(null)
  const [myPermissions, setMyPermissions] = useState<MyProjectPermissions | null>(null)
  const [components, setComponents] = useState<ProjectComponent[]>([])
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [memberCandidates, setMemberCandidates] = useState<ProjectMemberCandidate[]>([])
  const [statuses, setStatuses] = useState<ProjectStatus[]>([])
  const [workflow, setWorkflow] = useState<ProjectWorkflowTransition[]>([])
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null)
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('member')
  const [componentName, setComponentName] = useState('')
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null)
  const [editingComponentName, setEditingComponentName] = useState('')
  const [transition, setTransition] = useState<WorkflowTransitionInput>({
    name: '', from_status_ids: [], to_status_id: '', guard: { allowed_roles: ['lead', 'member'], requires_assignee: false },
  })
  const [editingTransitionId, setEditingTransitionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState('')

  async function loadSettings(id: string) {
    setLoading(true)
    setError('')
    const projectResult = await getProject(id)
    setProject(projectResult.project)
    setProjectName(projectResult.project.name)
    setProjectCode(projectResult.project.code)
    setRepositoryUrl(projectResult.project.repository_url ?? projectResult.project.repo_url ?? projectResult.project.repository ?? '')

    const results = await Promise.allSettled([
      getProjectPermissions(id),
      getProjectCapabilities(id),
      getMyProjectPermissions(id),
      getProjectComponents(id),
      getProjectMembers(id),
      getProjectMemberCandidates(id),
      getProjectAvailableStatuses(id),
      getProjectWorkflow(id),
    ])
    const [permissionsResult, capabilitiesResult, myPermissionsResult, componentsResult, membersResult, candidatesResult, statusesResult, workflowResult] = results
    if (permissionsResult.status === 'fulfilled') setPermissions(permissionsResult.value)
    if (capabilitiesResult.status === 'fulfilled') setCapabilities(capabilitiesResult.value)
    if (myPermissionsResult.status === 'fulfilled') setMyPermissions(myPermissionsResult.value)
    if (componentsResult.status === 'fulfilled') setComponents(componentsResult.value)
    if (membersResult.status === 'fulfilled') setMembers(membersResult.value)
    if (candidatesResult.status === 'fulfilled') setMemberCandidates(candidatesResult.value)
    if (statusesResult.status === 'fulfilled') setStatuses(statusesResult.value)
    if (workflowResult.status === 'fulfilled') setWorkflow(workflowResult.value.transitions)
    const loadedPermissions = myPermissionsResult.status === 'fulfilled' ? myPermissionsResult.value.permissions : []
    if (loadedPermissions.includes('manage_notification_preferences')) {
      const preferenceResult = await getNotificationPreferences(id)
      if (preferenceResult) setNotificationPreferences(preferenceResult)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!projectId) return
    void loadSettings(projectId).catch((requestError) => {
      setError(errorMessage(requestError, 'Unable to load project settings.'))
      setLoading(false)
    })
  }, [projectId])

  const availableStatusOptions = useMemo(() => {
    if (statuses.length) return statuses.filter((status) => project?.assigned_statuses.includes(status._id))
    return (project?.assigned_statuses || []).map((id, order) => ({ _id: id, name: `Status ${order + 1}`, order }))
  }, [project, statuses])

  const allCapabilities = useMemo(() => {
    const values = new Set<string>()
    Object.values(permissions?.roles || {}).forEach((role) => role.defaults.forEach((capability) => values.add(capability)))
    return [...values].sort()
  }, [permissions])

  function showMessage(nextMessage: string) {
    setMessage(nextMessage)
    setError('')
  }

  async function saveProject(event: FormEvent) {
    event.preventDefault()
    if (!project) return
    setBusy('project')
    try {
      await updateProject(project._id, { name: projectName, code: projectCode, repository_url: repositoryUrl })
      setProject((current) => current ? { ...current, name: projectName.trim(), code: projectCode.trim().toUpperCase(), repository_url: repositoryUrl.trim() || null } : current)
      showMessage('Project details updated.')
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to update project.'))
    } finally { setBusy('') }
  }

  async function archiveProject() {
    if (!project || user?.role !== 'super_admin' || !window.confirm(`Archive ${project.name}?`)) return
    setBusy('delete-project')
    try {
      await deleteProject(project._id)
      navigate('/projects')
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to archive project.'))
      setBusy('')
    }
  }

  async function saveRolePermissions() {
    if (!project || !permissions) return
    const role = permissions.roles[selectedRole]
    setBusy('permissions')
    try {
      const response = await updateProjectPermissions(project._id, selectedRole, role)
      setPermissions(response)
      showMessage(`${selectedRole} permissions updated.`)
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to update project permissions.'))
    } finally { setBusy('') }
  }

  function togglePermission(capability: string) {
    if (!permissions || capability === 'manage_project') return
    const current = permissions.roles[selectedRole]
    const isEnabled = current.effective.includes(capability)
    const isDefault = current.defaults.includes(capability)
    const grants = new Set(current.grants)
    const revocations = new Set(current.revocations)
    if (isEnabled) {
      if (isDefault) revocations.add(capability)
      else grants.delete(capability)
    } else if (isDefault) {
      revocations.delete(capability)
    } else {
      grants.add(capability)
    }
    setPermissions({ ...permissions, roles: { ...permissions.roles, [selectedRole]: { ...current, grants: [...grants], revocations: [...revocations], effective: isEnabled ? current.effective.filter((item) => item !== capability) : [...current.effective, capability] } } })
  }

  async function saveComponent(event: FormEvent) {
    event.preventDefault()
    if (!project || !componentName.trim()) return
    setBusy('component')
    try {
      const created = await createProjectComponent(project._id, componentName)
      setComponents((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)))
      setComponentName('')
      showMessage('Component created.')
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to create component.'))
    } finally { setBusy('') }
  }

  async function saveEditedComponent(componentId: string) {
    if (!project || !editingComponentName.trim()) return
    setBusy(`component-${componentId}`)
    try {
      const updated = await updateProjectComponent(project._id, componentId, editingComponentName)
      setComponents((current) => current.map((component) => component._id === componentId ? updated : component))
      setEditingComponentId(null)
      showMessage('Component updated.')
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to update component.'))
    } finally { setBusy('') }
  }

  async function removeComponent(component: ProjectComponent) {
    if (!project || !window.confirm(`Delete component ${component.name}?`)) return
    setBusy(`delete-component-${component._id}`)
    try {
      await deleteProjectComponent(project._id, component._id)
      setComponents((current) => current.filter((item) => item._id !== component._id))
      showMessage('Component deleted.')
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to delete component.'))
    } finally { setBusy('') }
  }

  function resetTransitionForm() {
    setEditingTransitionId(null)
    setTransition({ name: '', from_status_ids: [], to_status_id: '', guard: { allowed_roles: ['lead', 'member'], requires_assignee: false } })
  }

  function editTransition(item: ProjectWorkflowTransition) {
    setEditingTransitionId(item._id)
    setTransition(normalizeTransition(item))
  }

  async function saveTransition(event: FormEvent) {
    event.preventDefault()
    if (!project || !transition.name.trim() || !transition.from_status_ids.length || !transition.to_status_id) return
    setBusy('transition')
    try {
      if (editingTransitionId) await editWorkflowTransition(project._id, editingTransitionId, transition)
      else await addWorkflowTransition(project._id, transition)
      const response = await getProjectWorkflow(project._id)
      setWorkflow(response.transitions)
      resetTransitionForm()
      showMessage(editingTransitionId ? 'Workflow transition updated.' : 'Workflow transition added.')
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to save workflow transition.'))
    } finally { setBusy('') }
  }

  async function removeTransition(item: ProjectWorkflowTransition) {
    if (!project || !window.confirm(`Delete transition ${item.name}?`)) return
    setBusy(`delete-transition-${item._id}`)
    try {
      await deleteWorkflowTransition(project._id, item._id)
      setWorkflow((current) => current.filter((transitionItem) => transitionItem._id !== item._id))
      showMessage('Workflow transition deleted.')
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to delete workflow transition.'))
    } finally { setBusy('') }
  }

  async function saveWholeWorkflow() {
    if (!project) return
    setBusy('workflow')
    try {
      const response = await configureProjectWorkflow(project._id, workflow.map(normalizeTransition))
      setWorkflow(response.transitions)
      showMessage('Workflow saved.')
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to save workflow.'))
    } finally { setBusy('') }
  }

  async function toggleSuspension(member: ProjectMember) {
    if (!project) return
    setBusy(`suspension-${member.user_id}`)
    try {
      const response = await setProjectMemberSuspension(project._id, member.user_id, !member.suspended)
      setMembers((current) => current.map((item) => item.user_id === member.user_id ? { ...item, suspended: response.suspended } : item))
      showMessage(`${member.name} is now ${response.suspended ? 'suspended' : 'active'}.`)
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to update member suspension.'))
    } finally { setBusy('') }
  }

  async function makeLead(member: ProjectMember) {
    if (!project || member.role === 'lead' || !window.confirm(`Transfer project lead to ${member.name}?`)) return
    setBusy(`lead-${member.user_id}`)
    try {
      await transferProjectLead(project._id, member.user_id)
      setMembers((current) => current.map((item) => ({ ...item, role: item.user_id === member.user_id ? 'lead' : item.role === 'lead' ? 'member' : item.role, suspended: item.user_id === member.user_id ? false : item.suspended })))
      showMessage(`Project lead transferred to ${member.name}.`)
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to transfer project lead.'))
    } finally { setBusy('') }
  }

  function toggleNotificationEvent(eventType: string) {
    setNotificationPreferences((current) => {
      if (!current) return current
      const disabled = new Set(current.disabled_event_types)
      if (disabled.has(eventType)) disabled.delete(eventType)
      else disabled.add(eventType)
      return { ...current, disabled_event_types: [...disabled].sort() }
    })
  }

  async function saveNotificationSettings() {
    if (!project || !notificationPreferences) return
    setBusy('notifications')
    try {
      const updated = await updateNotificationPreferences(project._id, {
        enabled: notificationPreferences.enabled,
        disabled_event_types: notificationPreferences.disabled_event_types,
      })
      setNotificationPreferences(updated)
      showMessage('Notification preferences updated.')
    } catch (requestError) {
      setError(errorMessage(requestError, 'Unable to update notification preferences.'))
    } finally { setBusy('') }
  }

  if (loading) return <div className="page-content"><div className="panel loading-state"><span className="spinner" />Loading project settings...</div></div>
  if (error && !project) return <div className="page-content"><div className="inline-error"><span>{error}</span><Link to="/projects">Back to projects</Link></div></div>
  if (!project) return null

  const selectedPermissionRole = permissions?.roles[selectedRole]
  const statusName = new Map(availableStatusOptions.map((status) => [status._id, status.name]))
  return <div className="page-content project-settings-page">
    <div className="ticket-breadcrumb"><Link to="/projects">Projects</Link><span>/</span><Link to={`/projects/${project._id}`}>{project.code}</Link><span>/</span><span>Settings</span></div>
    <div className="settings-header"><div><h1>{project.name} settings</h1><p>Manage the project configuration, workflow, components, permissions, and members.</p></div><Link className="secondary-button" to={`/projects/${project._id}`}>Back to project</Link></div>
    {error && <div className="members-message members-error">{error}</div>}
    {message && <div className="members-message members-success">{message}</div>}

    <section className="panel settings-panel"><div className="reference-panel-heading"><div><h2>Project details</h2><p>Update the project name, key, or repository link.</p></div>{user?.role === 'super_admin' && <button className="danger-button" type="button" onClick={() => void archiveProject()} disabled={busy === 'delete-project'}>{busy === 'delete-project' ? 'Archiving...' : 'Archive project'}</button>}</div><form className="settings-form" onSubmit={(event) => void saveProject(event)}><label>Project name<input value={projectName} onChange={(event) => setProjectName(event.target.value)} maxLength={100} required /></label><label>Project key<input value={projectCode} onChange={(event) => setProjectCode(event.target.value.toUpperCase())} minLength={2} maxLength={10} required /></label><label>Repository URL<input type="url" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} maxLength={2048} placeholder="https://github.com/organization/repository" /></label><button className="primary-button" type="submit" disabled={busy === 'project'}>{busy === 'project' ? 'Saving...' : 'Save project details'}</button></form></section>

    <section className="settings-two-column">
      <article className="panel settings-panel"><div className="reference-panel-heading"><div><h2>My access</h2><p>Your effective project access.</p></div><span className="settings-badge">{capabilities?.role || myPermissions?.role || '—'}</span></div><div className="access-summary"><strong>{capabilities?.capabilities.length || myPermissions?.permissions.length || 0}</strong><span>capabilities available</span></div><div className="tag-list">{(capabilities?.capabilities || myPermissions?.permissions || []).map((permission) => <span key={permission}>{capabilityLabels[permission] || permission}</span>)}</div></article>
      <article className="panel settings-panel"><div className="reference-panel-heading"><div><h2>Role permissions</h2><p>Grant or revoke capabilities for a project role.</p></div></div>{permissions ? <><label className="settings-label">Role<select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as ProjectRole)}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select></label><div className="permission-grid">{allCapabilities.map((capability) => <label className={`permission-option ${capability === 'manage_project' ? 'permission-locked' : ''}`} key={capability}><input type="checkbox" checked={selectedPermissionRole?.effective.includes(capability) || false} disabled={capability === 'manage_project'} onChange={() => togglePermission(capability)} /><span>{capabilityLabels[capability] || capability}</span>{selectedPermissionRole?.defaults.includes(capability) && <small>default</small>}</label>)}</div><button className="primary-button" type="button" disabled={busy === 'permissions'} onClick={() => void saveRolePermissions()}>{busy === 'permissions' ? 'Saving...' : 'Save role permissions'}</button></> : <p className="settings-muted">You do not have permission to manage role permissions.</p>}</article>
    </section>

    <section className="panel settings-panel"><div className="reference-panel-heading"><div><h2>Components</h2><p>Maintain the components used to classify project tickets.</p></div><span className="settings-badge">{components.length}</span></div><form className="inline-settings-form" onSubmit={(event) => void saveComponent(event)}><input value={componentName} onChange={(event) => setComponentName(event.target.value)} placeholder="New component name" maxLength={100} required /><button className="primary-button" type="submit" disabled={busy === 'component'}>{busy === 'component' ? 'Adding...' : 'Add component'}</button></form><div className="settings-list">{components.length ? components.map((component) => <div className="settings-list-row" key={component._id}>{editingComponentId === component._id ? <><input value={editingComponentName} onChange={(event) => setEditingComponentName(event.target.value)} /><button className="text-button" type="button" onClick={() => void saveEditedComponent(component._id)} disabled={busy === `component-${component._id}`}>Save</button><button className="text-button muted" type="button" onClick={() => setEditingComponentId(null)}>Cancel</button></> : <><strong>{component.name}</strong><span className="settings-row-actions"><button className="text-button" type="button" onClick={() => { setEditingComponentId(component._id); setEditingComponentName(component.name) }}>Edit</button><button className="text-button danger-text" type="button" onClick={() => void removeComponent(component)} disabled={busy === `delete-component-${component._id}`}>Delete</button></span></>}</div>) : <p className="settings-muted">No components configured.</p>}</div></section>

    <section className="panel settings-panel"><div className="reference-panel-heading"><div><h2>Workflow transitions</h2><p>Define which project statuses can move to each other.</p></div><button className="secondary-button" type="button" onClick={() => void saveWholeWorkflow()} disabled={busy === 'workflow'}>{busy === 'workflow' ? 'Saving...' : 'Save all workflow'}</button></div><form className="workflow-form" onSubmit={(event) => void saveTransition(event)}><label>Transition name<input value={transition.name} onChange={(event) => setTransition((current) => ({ ...current, name: event.target.value }))} maxLength={100} required /></label><label>From status<select value={transition.from_status_ids[0] || ''} onChange={(event) => setTransition((current) => ({ ...current, from_status_ids: event.target.value ? [event.target.value] : [] }))} required><option value="">Select source status</option>{availableStatusOptions.map((status) => <option value={status._id} key={status._id}>{status.name}</option>)}</select></label><label>To status<select value={transition.to_status_id} onChange={(event) => setTransition((current) => ({ ...current, to_status_id: event.target.value }))} required><option value="">Select target status</option>{availableStatusOptions.map((status) => <option value={status._id} key={status._id}>{status.name}</option>)}</select></label><div className="workflow-role-options"><span>Allowed roles</span>{roles.map((role) => <label key={role}><input type="checkbox" checked={transition.guard.allowed_roles.includes(role)} onChange={() => setTransition((current) => { const allowedRoles = current.guard.allowed_roles.includes(role) ? current.guard.allowed_roles.filter((item) => item !== role) : [...current.guard.allowed_roles, role]; return { ...current, guard: { ...current.guard, allowed_roles: allowedRoles } } })} />{role}</label>)}<label><input type="checkbox" checked={transition.guard.requires_assignee} onChange={(event) => setTransition((current) => ({ ...current, guard: { ...current.guard, requires_assignee: event.target.checked } }))} />Requires assignee</label></div><div className="settings-row-actions"><button className="primary-button" type="submit" disabled={busy === 'transition' || transition.guard.allowed_roles.length === 0}>{editingTransitionId ? 'Update transition' : 'Add transition'}</button>{editingTransitionId && <button className="secondary-button" type="button" onClick={resetTransitionForm}>Cancel edit</button>}</div></form><div className="settings-list workflow-list">{workflow.length ? workflow.map((item) => <div className="settings-list-row" key={item._id}><div><strong>{item.name}</strong><small>{item.from_status_ids.map((id) => statusName.get(id) || id).join(', ')} → {statusName.get(item.to_status_id) || item.to_status_id}</small></div><span className="settings-row-actions"><button className="text-button" type="button" onClick={() => editTransition(item)}>Edit</button><button className="text-button danger-text" type="button" onClick={() => void removeTransition(item)} disabled={busy === `delete-transition-${item._id}`}>Delete</button></span></div>) : <p className="settings-muted">No workflow transitions configured.</p>}</div></section>

    <section className="panel settings-panel"><div className="reference-panel-heading"><div><h2>Project members</h2><p>Suspend members or transfer project lead ownership.</p></div><span className="settings-badge">{members.length}</span></div>{memberCandidates.length > 0 && <p className="settings-muted">{memberCandidates.length} additional active users can be assigned from the Members section on the project overview.</p>}<div className="settings-list members-settings-list">{members.length ? members.map((member) => <div className="settings-list-row" key={member.user_id}><div className="member-identity"><strong>{member.name} <span className="role-pill">{member.role}</span></strong><small>{member.email}{member.suspended ? ' · Suspended' : ''}</small></div><span className="settings-row-actions"><button className="text-button" type="button" onClick={() => void toggleSuspension(member)} disabled={busy === `suspension-${member.user_id}` || member.role === 'lead'}>{member.suspended ? 'Activate' : 'Suspend'}</button><button className="text-button" type="button" onClick={() => void makeLead(member)} disabled={busy === `lead-${member.user_id}` || member.role === 'lead' || member.suspended}>Make lead</button></span></div>) : <p className="settings-muted">No project members found.</p>}</div></section>

    {notificationPreferences && <section className="panel settings-panel"><div className="reference-panel-heading"><div><h2>Notification preferences</h2><p>Choose which project events appear in your notifications.</p></div><button className="primary-button" type="button" onClick={() => void saveNotificationSettings()} disabled={busy === 'notifications'}>{busy === 'notifications' ? 'Saving...' : 'Save preferences'}</button></div><label className="permission-option"><input type="checkbox" checked={notificationPreferences.enabled} onChange={(event) => setNotificationPreferences((current) => current ? { ...current, enabled: event.target.checked } : current)} /><span>Enable project notifications</span></label><div className="permission-grid notification-preference-grid">{notificationPreferences.available_event_types.map((eventType) => <label className="permission-option" key={eventType}><input type="checkbox" checked={!notificationPreferences.disabled_event_types.includes(eventType)} onChange={() => toggleNotificationEvent(eventType)} /><span>{capabilityLabels[eventType] || eventType.replaceAll('_', ' ')}</span></label>)}</div></section>}
  </div>
}
