export type LoginRequest = { email: string; password: string }
export type LoginResponse = { access_token: string; token_type: string }
export type AuthUser = { user_id?: string; email: string; username?: string; role?: 'super_admin' | 'admin' | null }
