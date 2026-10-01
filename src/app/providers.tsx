import { useMemo, useState } from 'react'
import { login as loginRequest } from '../features/auth/api/authApi'
import { AuthContext } from '../features/auth/hooks/useAuth'
import { initialAuthState } from '../features/auth/store/authStore'
import { storage } from '../services/storage'
import type { LoginRequest } from '../features/auth/types/auth.types'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState(initialAuthState)
  const value = useMemo(() => ({
    isAuthenticated: Boolean(auth.token),
    login: async (request: LoginRequest) => { const response = await loginRequest(request); storage.setToken(response.access_token); setAuth({ token: response.access_token, user: { email: request.email } }) },
    logout: () => { storage.clearToken(); setAuth({ token: null, user: null }) },
  }), [auth.token])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AppProviders({ children }: { children: React.ReactNode }) { return <AuthProvider>{children}</AuthProvider> }
