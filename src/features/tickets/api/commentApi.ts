import { apiClient } from '../../../services/apiClient'
import type { TicketComment } from '../types/ticket.types'

export type CommentVisibility = 'public' | 'internal'

export function getComments(ticketId: string) {
  return apiClient<TicketComment[]>(`/tickets/${ticketId}/comments`)
}

export function createComment(ticketId: string, message: string, visibility: CommentVisibility) {
  return apiClient<{ message: string; comment_id: string; comment: TicketComment }>(`/tickets/${ticketId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ message: message.trim(), visibility }),
  })
}

export function createCommentReply(commentId: string, message: string) {
  return apiClient<{ message: string; comment_id: string; comment: TicketComment }>(`/comments/${commentId}/replies`, {
    method: 'POST',
    body: JSON.stringify({ message: message.trim() }),
  })
}

export function updateComment(commentId: string, message: string, visibility?: CommentVisibility) {
  return apiClient<{ message: string }>(`/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ message: message.trim(), ...(visibility ? { visibility } : {}) }),
  })
}

export function deleteComment(commentId: string) {
  return apiClient<{ message: string; reparented_reply_count: number }>(`/comments/${commentId}`, { method: 'DELETE' })
}
