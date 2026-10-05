import type { Ticket } from '../../tickets/types/ticket.types'

export type BoardColumn = { status_id: string; status_name: string; tickets: Ticket[] }
export type ProjectBoard = { project_id: string; scope: 'sprint' | 'backlog'; sprint: unknown | null; columns: BoardColumn[] }
export type TicketTransition = { _id: string; name: string; from_status_ids: string[]; to_status_id: string; to_status_name: string | null; available: boolean; blocked_reason?: string | null }
export type WorkflowGuard = { allowed_roles: string[]; requires_assignee: boolean }
export type ProjectWorkflowTransition = { _id: string; name: string; from_status_ids: string[]; to_status_id: string; guard?: WorkflowGuard }
