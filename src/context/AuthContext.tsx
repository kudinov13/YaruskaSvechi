import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setToken, clearToken } from '../lib/api'

type User = { id: string; email: string; name: string; role?: 'USER' | 'ADMIN'; isAdmin?: boolean; phone?: string }

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string, phone?: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue>(null as unknown as AuthContextValue)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false)
      return
    }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login({ email, password })
    setToken(token)
    setUser(user)
  }

  const register = async (email: string, name: string, password: string, phone?: string) => {
    const { token, user } = await api.register({ email, name, password, phone })
    setToken(token)
    setUser(user)
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin: user?.role === 'ADMIN' || user?.isAdmin === true }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
