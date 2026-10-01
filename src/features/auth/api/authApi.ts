import { apiClient } from '../../../services/apiClient'
import type { LoginRequest, LoginResponse } from '../types/auth.types'

export function login(request: LoginRequest) {
  return apiClient<LoginResponse>('/login', { method: 'POST', body: JSON.stringify(request) })
}
