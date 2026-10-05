import { apiClient } from '../../../services/apiClient'
import type { CreateProjectRequest, Project, ProjectMember, ProjectMemberCandidate, ProjectRole, ProjectStatus } from '../types/project.types'
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
    body: JSON.stringify({ name: request.name.trim(), code: request.code.trim().toUpperCase() }),
  })
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

export function removeProjectMember(projectId: string, userId: string) {
  return apiClient(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' })
}
