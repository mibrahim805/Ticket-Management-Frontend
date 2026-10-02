import { apiClient } from '../../../services/apiClient'
import type { CreateProjectRequest, Project } from '../types/project.types'
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
