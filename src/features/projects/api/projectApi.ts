import { apiClient } from '../../../services/apiClient'
import type { CreateProjectRequest, Project } from '../types/project.types'

export function getProjects() {
  return apiClient<{ projects: Project[] }>('/projects')
}

export function createProject(request: CreateProjectRequest) {
  return apiClient<{ id: string; message: string }>('/projects', {
    method: 'POST',
    body: JSON.stringify({ name: request.name.trim(), code: request.code.trim().toUpperCase() }),
  })
}
