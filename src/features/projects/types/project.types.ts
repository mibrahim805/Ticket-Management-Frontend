export type Project = {
  _id: string
  name: string
  code: string
  created_by: string
  total_tickets: number
  assigned_statuses: string[]
  default_status_id: string | null
}

export type CreateProjectRequest = { name: string; code: string }

export type ProjectMember = { user_id: string; name: string; email: string; role: 'lead' | 'member' | 'reporter' }
