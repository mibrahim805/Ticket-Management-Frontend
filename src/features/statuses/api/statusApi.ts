import { apiClient } from '../../../services/apiClient'
import type { DefaultWorkflowResponse, StatusInput, WorkflowStatus } from '../types/status.types'

export function listStatuses() {
  return apiClient<WorkflowStatus[]>('/statuses/')
}

export function createStatus(input: StatusInput) {
  return apiClient<WorkflowStatus>('/statuses/', { method: 'POST', body: JSON.stringify(input) })
}

export function createDefaultWorkflowStatuses() {
  return apiClient<DefaultWorkflowResponse>('/statuses/default-workflow', { method: 'POST' })
}

export function updateStatus(statusId: string, input: Partial<StatusInput>) {
  return apiClient<{ message: string }>(`/statuses/${statusId}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function deleteStatus(statusId: string) {
  return apiClient<{ message: string }>(`/statuses/${statusId}`, { method: 'DELETE' })
}
