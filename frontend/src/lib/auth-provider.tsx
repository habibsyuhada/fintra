import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import axios from 'axios'
import { useAuthStore } from './auth-store'

const AuthContext = createContext<{ ready: boolean }>({ ready: false })

export function useAuthReady() {
  return useContext(AuthContext).ready
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    let cancelled = false
    axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then(({ data }) => {
        if (!cancelled) setAuth(data.user, data.accessToken)
      })
      .catch(() => {
        // no valid session — user needs to log in
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [setAuth])

  return <AuthContext.Provider value={{ ready }}>{children}</AuthContext.Provider>
}
