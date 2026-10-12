import { apiClient } from '../../../services/apiClient'
import type {
  ChangePasswordRequest,
  CreateManagedUserRequest,
  AuthUser,
  LoginRequest,
  LoginResponse,
  ManagedRole,
  MessageResponse,
  RegisterRequest,
  UpdateProfileRequest,
  UsersResponse,
} from '../types/auth.types'

export function registerSuperAdmin(request: Omit<RegisterRequest, 'is_active'>) {
  return apiClient<MessageResponse>('/register_super_admin', { method: 'POST', body: JSON.stringify(request) })
}

export function register(request: RegisterRequest) {
  return apiClient<MessageResponse>('/register', { method: 'POST', body: JSON.stringify(request) })
}

export function registerAdmin(request: RegisterRequest) {
  return apiClient<MessageResponse>('/register_admin', { method: 'POST', body: JSON.stringify(request) })
}

export function login(request: LoginRequest) {
  return apiClient<LoginResponse>('/login', { method: 'POST', body: JSON.stringify(request) })
}

export function getProfile() {
  return apiClient<AuthUser>('/me')
}

export function listUsers() {
  return apiClient<UsersResponse>('/users')
}

export function createManagedUser(request: CreateManagedUserRequest) {
  return apiClient<MessageResponse>('/users', { method: 'POST', body: JSON.stringify(request) })
}

export function toggleUserActive(userId: string) {
  return apiClient<MessageResponse>(`/activate_or_deactivate/${userId}`, { method: 'PUT' })
}

export function changeUserRole(userId: string, role: ManagedRole) {
  return apiClient<MessageResponse>(`/change_role/${userId}`, { method: 'PUT', body: JSON.stringify({ role }) })
}

export function updateProfile(request: UpdateProfileRequest) {
  return apiClient<MessageResponse>('/update_yourself/', { method: 'PUT', body: JSON.stringify(request) })
}

export function changePassword(request: ChangePasswordRequest) {
  return apiClient<MessageResponse>('/change_password/', { method: 'PUT', body: JSON.stringify(request) })
}

export function requestPasswordReset(email: string) {
  return apiClient<MessageResponse>('/request-password-reset', { method: 'POST', body: JSON.stringify({ email }) })
}

export function resetPassword(token: string, newPassword: string) {
  return apiClient<MessageResponse>('/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password: newPassword }) })
}
