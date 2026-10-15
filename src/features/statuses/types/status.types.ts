export type WorkflowStatus = {
  _id: string
  name: string
  name_key?: string
  order: number
  key: string
  category: string
  created_at?: string
}

export type StatusInput = {
  name: string
  order: number
  key?: string
  category?: string
}

export type DefaultWorkflowResponse = {
  message: string
  created_count: number
  created_statuses: WorkflowStatus[]
  workflow_statuses: WorkflowStatus[]
}
