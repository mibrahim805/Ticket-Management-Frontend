export type ActivityPeriod = 'week' | 'month' | 'all'
export type DashboardActivity = { id: string; action: string; actor_name: string; changed_at: string; ticket_code: string; ticket_title: string; project_key: string }
export type DashboardActivityResponse = { period: ActivityPeriod; total: number; status_counts: Record<string, number>; activities: DashboardActivity[] }
export type ActivityEvent = { _id: string; ticket_id?: string; project_id?: string; action: string; changed_by?: string; changed_at?: string; changes?: Array<Record<string, unknown>> }
export type TicketActivityResponse = { ticket_id: string; ticket_code: string; activities: ActivityEvent[] }
export type ProjectActivityResponse = { project_id: string; activities: ActivityEvent[] }
