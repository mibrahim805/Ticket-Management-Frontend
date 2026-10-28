export type Project = {
  _id: string
  name: string
  code: string
  /** Optional repository metadata returned by projects created with repo integration. */
  repository_url?: string | null
  repo_url?: string | null
  repository?: string | null
  created_by: string
  total_tickets: number
  assigned_statuses: string[]
  default_status_id: string | null
  created_at?: string
}

export type CreateProjectRequest = { name: string; code: string; repository_url?: string | null }

export type ProjectMember = { user_id: string; name: string; email: string; role: 'lead' | 'member' | 'reporter'; suspended?: boolean }
export type ProjectRole = ProjectMember['role']
export type ProjectMemberCandidate = { user_id: string; name: string; email: string }
export type ProjectStatus = { _id: string; name: string; order: number }
export type ProjectComponent = { _id: string; project_id: string; name: string; name_key?: string }
export type ProjectPermissionRole = { defaults: string[]; grants: string[]; revocations: string[]; effective: string[] }
export type ProjectPermissions = { project_id: string; roles: Record<ProjectRole, ProjectPermissionRole> }
export type ProjectCapabilities = { project_id: string; role: string; capabilities: string[]; can: Record<string, boolean> }
export type MyProjectPermissions = { role: string; permissions: string[] }
