import { apiClient } from '../../../services/apiClient'

export type ReportDashboardTicket = {
  ticket_id: string
  ticket_code: string
  project_id: string
  title: string
  priority?: string
  current_status_name?: string
  sprint_id?: string | null
  story_points?: number
  due_date?: string | null
  is_overdue: boolean
}

export type MyDashboardReport = {
  user_id: string
  project_count: number
  counts: {
    my_open_issues: number
    assigned_to_me: number
    overdue_assigned_to_me: number
  }
  my_open_issues: ReportDashboardTicket[]
  assigned_to_me: ReportDashboardTicket[]
}

export type ProjectReportSummary = {
  project: { project_id: string; code: string; name: string }
  total_tickets: number
  open_tickets: number
  assigned_tickets: number
  unassigned_tickets: number
  overdue_tickets: number
  by_status: Record<string, number>
  by_priority: Record<string, number>
  agile: {
    backlog_tickets: number
    backlog_story_points: number
    active_sprint: {
      sprint_id: string
      name: string
      start_date?: string | null
      end_date?: string | null
      total_tickets: number
      completed_tickets: number
      committed_story_points: number
      completed_story_points: number
    } | null
  }
}

export type ProjectVelocityReport = {
  project: { project_id: string; code: string; name: string }
  completed_sprints: number
  average_velocity: number
  latest_velocity: number
  velocity_delta: number | null
  trend: 'up' | 'down' | 'flat'
  sprints: Array<{
    sprint_id: string
    name: string
    start_date?: string | null
    end_date?: string | null
    completed_at?: string | null
    committed_tickets: number
    completed_tickets: number
    committed_story_points: number
    completed_story_points: number
    velocity: number
    completion_rate: number
  }>
}

export type AgentTicketsReport = {
  data: Array<{
    agent_id: string
    agent_name: string
    total_tickets: number
    open_tickets: number
    in_progress_tickets: number
    on_hold_tickets: number
    resolved_tickets: number
    closed_tickets: number
  }>
}

export type OverdueTicketsReport = {
  total_overdue: number
  by_priority: Record<string, number>
  by_agent: Record<string, number>
}

export type ResolutionTimeReport = {
  avg_resolution_hours: number
  min_resolution_hours: number
  max_resolution_hours: number
  total_resolved: number
  by_priority: Record<string, number>
}

export function getMyDashboardReport(limit = 20) {
  return apiClient<MyDashboardReport>(`/reports/my-dashboard?limit=${limit}`)
}

export function getProjectReportSummary(projectId: string) {
  return apiClient<ProjectReportSummary>(`/reports/projects/${projectId}/summary`)
}

export function getProjectVelocityReport(projectId: string, limit = 10) {
  return apiClient<ProjectVelocityReport>(`/reports/projects/${projectId}/velocity?limit=${limit}`)
}

export function getAgentTicketsReport() {
  return apiClient<AgentTicketsReport>('/reports/agent-tickets')
}

export function getOverdueTicketsReport() {
  return apiClient<OverdueTicketsReport>('/reports/overdue-tickets')
}

export function getResolutionTimeReport() {
  return apiClient<ResolutionTimeReport>('/reports/avg-resolution-time')
}
