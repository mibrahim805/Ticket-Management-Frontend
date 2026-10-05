import { appConfig } from '../../../app/config'
import { apiClient } from '../../../services/apiClient'
import { storage } from '../../../services/storage'

export type TicketAttachment = {
  attachment_id: string
  ticket_id: string
  original_name: string
  stored_name?: string
  extension: string
  content_type: string
  size: number
  uploaded_by: string
  uploaded_at: string
  download_url: string
}

export function getAttachments(ticketId: string) {
  return apiClient<TicketAttachment[]>(`/tickets/${ticketId}/attachments`)
}

export function uploadAttachment(ticketId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return apiClient<{ message: string; attachment_id: string; file_name: string }>(`/tickets/${ticketId}/attachments`, {
    method: 'POST',
    body: formData,
  })
}

export async function downloadAttachment(attachmentId: string) {
  const headers = new Headers()
  const token = storage.getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${appConfig.apiUrl}/attachments/${attachmentId}`, { headers })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(typeof body?.detail === 'string' ? body.detail : `Unable to download attachment (${response.status}).`)
  }
  return response.blob()
}

export function deleteAttachment(attachmentId: string) {
  return apiClient<{ message: string }>(`/attachments/${attachmentId}`, { method: 'DELETE' })
}
