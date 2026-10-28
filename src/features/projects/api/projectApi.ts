import { apiClient } from '../../../services/apiClient'
import type { CreateProjectRequest, MyProjectPermissions, Project, ProjectCapabilities, ProjectComponent, ProjectMember, ProjectMemberCandidate, ProjectPermissionRole, ProjectPermissions, ProjectRole, ProjectStatus } from '../types/project.types'
import type { Ticket, TicketPagination } from '../../tickets/types/ticket.types'

export function getProject(projectId: string) {
  return apiClient<{ project: Project }>(`/projects/${projectId}`)
}

export function getProjectTickets(projectKey: string) {
  return apiClient<{ data: Ticket[]; pagination: TicketPagination }>(`/tickets/${encodeURIComponent(projectKey)}?page=1&page_size=5&sort_by=created_at&sort_order=desc`)
}

export function getProjects() {
  return apiClient<{ projects: Project[] }>('/projects')
}

export function createProject(request: CreateProjectRequest) {
  return apiClient<{ id: string; message: string }>('/projects', {
    method: 'POST',
    body: JSON.stringify({ name: request.name.trim(), code: request.code.trim().toUpperCase(), repository_url: request.repository_url?.trim() || null }),
  })
}

export function updateProject(projectId: string, request: Partial<CreateProjectRequest>) {
  return apiClient<{ message: string }>(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...(request.name === undefined ? {} : { name: request.name.trim() }),
      ...(request.code === undefined ? {} : { code: request.code.trim().toUpperCase() }),
      ...(request.repository_url === undefined ? {} : { repository_url: request.repository_url?.trim() || null }),
    }),
  })
}

export function deleteProject(projectId: string) {
  return apiClient<{ message: string }>(`/projects/${projectId}`, { method: 'DELETE' })
}

export function getProjectPermissions(projectId: string) {
  return apiClient<ProjectPermissions>(`/projects/${projectId}/permissions`)
}

export function updateProjectPermissions(projectId: string, role: ProjectRole, permissions: Pick<ProjectPermissionRole, 'grants' | 'revocations'>) {
  return apiClient<ProjectPermissions>(`/projects/${projectId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ role, grants: permissions.grants, revocations: permissions.revocations }),
  })
}

export function getProjectCapabilities(projectId: string) {
  return apiClient<ProjectCapabilities>(`/projects/${projectId}/capabilities`)
}

export function getMyProjectPermissions(projectId: string) {
  return apiClient<MyProjectPermissions>(`/projects/${projectId}/my-permissions`)
}

export function getProjectComponents(projectId: string) {
  return apiClient<ProjectComponent[]>(`/projects/${projectId}/components`)
}

export function createProjectComponent(projectId: string, name: string) {
  return apiClient<ProjectComponent>(`/projects/${projectId}/components`, { method: 'POST', body: JSON.stringify({ name: name.trim() }) })
}

export function updateProjectComponent(projectId: string, componentId: string, name: string) {
  return apiClient<ProjectComponent>(`/projects/${projectId}/components/${componentId}`, { method: 'PATCH', body: JSON.stringify({ name: name.trim() }) })
}

export function deleteProjectComponent(projectId: string, componentId: string) {
  return apiClient<null>(`/projects/${projectId}/components/${componentId}`, { method: 'DELETE' })
}

export function getProjectAvailableStatuses(projectId: string) {
  return apiClient<ProjectStatus[]>(`/projects/${projectId}/available-statuses`)
}

export function assignProjectStatuses(projectId: string, statusIds: string[], statusMigrations: Array<{ remove_status_id: string; move_existing_tickets_to: string }>) {
  return apiClient(`/projects/${projectId}/statuses`, {
    method: 'PATCH',
    body: JSON.stringify({ status_ids: statusIds, status_migrations: statusMigrations }),
  })
}

export function getProjectMembers(projectId: string) {
  return apiClient<ProjectMember[]>(`/projects/${projectId}/members`)
}

export function getProjectMemberCandidates(projectId: string) {
  return apiClient<ProjectMemberCandidate[]>(`/projects/${projectId}/member-candidates`)
}

export function addProjectMember(projectId: string, userId: string, role: ProjectRole) {
  return apiClient(`/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, role }),
  })
}

export function updateProjectMemberRole(projectId: string, userId: string, role: ProjectRole) {
  return apiClient(`/projects/${projectId}/members/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}

export function setProjectMemberSuspension(projectId: string, userId: string, suspended: boolean) {
  return apiClient<{ message: string; suspended: boolean }>(`/projects/${projectId}/members/${userId}/suspension`, {
    method: 'PATCH',
    body: JSON.stringify({ suspended }),
  })
}

export function transferProjectLead(projectId: string, userId: string) {
  return apiClient<{ message: string; user_id: string }>(`/projects/${projectId}/members/${userId}/transfer-lead`, { method: 'POST' })
}

export function removeProjectMember(projectId: string, userId: string) {
  return apiClient(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' })
}
