import { apiClient } from '../../../services/apiClient'
import type { ProjectBoard, ProjectWorkflowTransition, TicketTransition, WorkflowGuard } from '../types/workflow.types'

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

export type WorkflowTransitionInput = {
  name: string
  from_status_ids: string[]
  to_status_id: string
  guard: WorkflowGuard
}

export function configureProjectWorkflow(projectId: string, transitions: WorkflowTransitionInput[]) {
  return apiClient<{ project_id: string; transitions: ProjectWorkflowTransition[] }>(`/projects/${projectId}/workflow`, {
    method: 'PUT',
    body: JSON.stringify({ transitions }),
  })
}

export function editWorkflowTransition(projectId: string, transitionId: string, transition: Partial<WorkflowTransitionInput>) {
  return apiClient<ProjectWorkflowTransition>(`/projects/${projectId}/workflow/transitions/${transitionId}`, {
    method: 'PATCH',
    body: JSON.stringify(transition),
  })
}

export function deleteWorkflowTransition(projectId: string, transitionId: string) {
  return apiClient<null>(`/projects/${projectId}/workflow/transitions/${transitionId}`, { method: 'DELETE' })
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
