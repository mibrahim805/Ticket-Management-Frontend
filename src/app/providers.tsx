import { useEffect, useMemo, useState } from 'react'
import { getProfile, login as loginRequest } from '../features/auth/api/authApi'
import { AuthContext } from '../features/auth/hooks/useAuth'
import { initialAuthState } from '../features/auth/store/authStore'
import { storage } from '../services/storage'
import type { LoginRequest } from '../features/auth/types/auth.types'
import { ThemeProvider } from '../features/theme/ThemeProvider'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState(initialAuthState)
  useEffect(() => {
    if (!auth.token) return
    let isCurrent = true
    void getProfile().then((user) => {
      if (isCurrent) setAuth((current) => current.token === auth.token ? { ...current, user } : current)
    }).catch(() => undefined)
    return () => { isCurrent = false }
  }, [auth.token])
  const value = useMemo(() => ({
    isAuthenticated: Boolean(auth.token),
    login: async (request: LoginRequest) => {
      const response = await loginRequest(request)
      storage.setToken(response.access_token)
      const user = await getProfile()
      setAuth({ token: response.access_token, user })
    },
    logout: () => { storage.clearToken(); storage.clearSessionPreferences(); setAuth({ token: null, user: null }) },
    refreshUser: async () => {
      const user = await getProfile()
      setAuth((current) => ({ ...current, user }))
    },
    user: auth.user,
  }), [auth.token, auth.user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ThemeProvider><AuthProvider>{children}</AuthProvider></ThemeProvider>
}
