import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isAxiosError } from 'axios'
import { api } from './api'
import { getCachedUser, useAuthStore, wasGuestMode } from './auth-store'
import { useNetworkStatusEffect, useNetworkStore } from './network-status'
import { getDb } from './db'
import { runSync } from './sync-engine'

const AuthContext = createContext<{ ready: boolean }>({ ready: false })

export function useAuthReady() {
  return useContext(AuthContext).ready
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const restoreOfflineUser = useAuthStore((s) => s.restoreOfflineUser)
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest)
  const userId = useAuthStore((s) => s.user?.id)
  const isGuest = useAuthStore((s) => s.isGuest)
  const online = useNetworkStore((s) => s.online)

  useNetworkStatusEffect()

  useEffect(() => {
    // Guests have no server account to sync against.
    if (online && userId && !isGuest) void runSync(getDb(userId))
  }, [online, userId, isGuest])

  useEffect(() => {
    let cancelled = false
    api
      .post('/auth/refresh', {})
      .then(({ data }) => {
        if (!cancelled) {
          setAuth(data.user, data.accessToken)
          void runSync(getDb(data.user.id))
        }
      })
      .catch((err) => {
        if (cancelled) return
        // A network failure (no response at all) doesn't mean the session
        // is invalid — it means we're offline. Fall back to the last known
        // logged-in user, or to guest mode, so cached data is still usable.
        const isNetworkFailure = isAxiosError(err) && !err.response
        const cachedUser = getCachedUser()
        if (isNetworkFailure && cachedUser) {
          restoreOfflineUser(cachedUser)
        } else if (wasGuestMode()) {
          continueAsGuest()
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [setAuth, restoreOfflineUser, continueAsGuest])

  return <AuthContext.Provider value={{ ready }}>{children}</AuthContext.Provider>
}
