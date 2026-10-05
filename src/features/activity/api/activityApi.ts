import { apiClient } from '../../../services/apiClient'
import type { ActivityPeriod, DashboardActivityResponse, ProjectActivityResponse, TicketActivityResponse } from '../types/activity.types'

export function getDashboardActivity(period: ActivityPeriod = 'week') {
  return apiClient<DashboardActivityResponse>(`/activities/dashboard?period=${period}`)
}

export function getTicketActivity(ticketId: string) {
  return apiClient<TicketActivityResponse>(`/activities/tickets/${ticketId}`)
}

export function getProjectActivity(projectId: string) {
  return apiClient<ProjectActivityResponse>(`/activities/projects/${projectId}`)
}
