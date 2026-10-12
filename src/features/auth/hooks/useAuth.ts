import { createContext, useContext } from 'react'
import type { LoginRequest } from '../types/auth.types'
import type { AuthUser } from '../types/auth.types'

export type AuthContextValue = {
  isAuthenticated: boolean
  user: AuthUser | null
  login: (request: LoginRequest) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
