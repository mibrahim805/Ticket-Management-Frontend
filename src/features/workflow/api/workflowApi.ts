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

function linearTransitions(columns: Array<{ status_id: string; status_name: string }>) {
  return columns.slice(0, -1).map((column, index) => {
    const nextColumn = columns[index + 1]
    return {
      name: `${column.status_name} to ${nextColumn.status_name}`,
      from_status_ids: [column.status_id],
      to_status_id: nextColumn.status_id,
      guard: { allowed_roles: ['lead', 'member'], requires_assignee: false },
    }
  })
}

export function addWorkflowTransition(projectId: string, transition: ReturnType<typeof linearTransitions>[number]) {
  return apiClient(`/projects/${projectId}/workflow/transitions`, { method: 'POST', body: JSON.stringify(transition) })
}

export async function configureLinearWorkflow(projectId: string, columns: Array<{ status_id: string; status_name: string }>) {
  const current = await getProjectWorkflow(projectId)
  const existing = current.transitions
  for (const transition of linearTransitions(columns)) {
    const alreadyExists = existing.some((item) => item.to_status_id === transition.to_status_id && item.from_status_ids.length === 1 && item.from_status_ids[0] === transition.from_status_ids[0])
    if (!alreadyExists) await addWorkflowTransition(projectId, transition)
  }
  return getProjectWorkflow(projectId)
}

export function executeTicketTransition(ticketId: string, transitionId: string) {
  return apiClient(`/tickets/${ticketId}/transitions/${transitionId}`, { method: 'POST' })
}
