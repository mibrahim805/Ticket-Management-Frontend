import { storage } from '../../../services/storage'
import type { AuthUser } from '../types/auth.types'

export type AuthState = { token: string | null; user: AuthUser | null }

export function initialAuthState(): AuthState {
  const token = storage.getToken()
  return { token, user: null }
}
