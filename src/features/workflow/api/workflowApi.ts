import { apiClient } from '../../../services/apiClient'
import type { ProjectBoard, ProjectWorkflowTransition, TicketTransition } from '../types/workflow.types'

export function getProjectBoard(projectId: string) {
  return apiClient<ProjectBoard>(`/projects/${projectId}/board`)
}

export function getTicketTransitions(ticketId: string) {
  return apiClient<{ transitions: TicketTransition[] }>(`/tickets/${ticketId}/transitions`)
}

export function getProjectWorkflow(projectId: string) {
  return apiClient<{ project_id: string; transitions: ProjectWorkflowTransition[] }>(`/projects/${projectId}/workflow`)
}

export function configureLinearWorkflow(projectId: string, columns: Array<{ status_id: string; status_name: string }>) {
  const transitions = columns.slice(0, -1).map((column, index) => {
    const nextColumn = columns[index + 1]
    return {
      name: `${column.status_name} to ${nextColumn.status_name}`,
      from_status_ids: [column.status_id],
      to_status_id: nextColumn.status_id,
      guard: { allowed_roles: ['lead', 'member'], requires_assignee: false },
    }
  })
  return apiClient(`/projects/${projectId}/workflow`, { method: 'PUT', body: JSON.stringify({ transitions }) })
}

export function executeTicketTransition(ticketId: string, transitionId: string) {
  return apiClient(`/tickets/${ticketId}/transitions/${transitionId}`, { method: 'POST' })
}
