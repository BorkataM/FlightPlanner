import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '../services/api'
import type { LoginData, RegisterData, AuthResponse } from '../services/api'

export interface AuthUser {
  userId:       number
  email:        string
  firstName:    string
  lastName:     string
  token:        string
  refreshToken: string
}

interface AuthContextValue {
  user:            AuthUser | null
  login:           (data: LoginData)    => Promise<void>
  register:        (data: RegisterData) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  logout:          () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'skywave_user'

function toAuthUser(r: AuthResponse): AuthUser {
  return {
    userId:       r.userId,
    email:        r.email,
    firstName:    r.firstName,
    lastName:     r.lastName,
    token:        r.token,
    refreshToken: r.refreshToken,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as AuthUser) : null
  })

  const persist = useCallback((u: AuthUser) => {
    setUser(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }, [])

  const login = useCallback(async (data: LoginData) => {
    const res = await authApi.login(data)
    persist(toAuthUser(res))
  }, [persist])

  const register = useCallback(async (data: RegisterData) => {
    const res = await authApi.register(data)
    persist(toAuthUser(res))
  }, [persist])

  const loginWithGoogle = useCallback(async (credential: string) => {
    const res = await authApi.googleAuth(credential)
    persist(toAuthUser(res))
  }, [persist])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
