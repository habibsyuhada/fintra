import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore, type AuthUser } from '../lib/auth-store'
import { migrateGuestDataIfAny } from '../lib/guest-migration'

interface AuthResponse {
  user: AuthUser
  accessToken: string
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const wasGuest = useAuthStore.getState().isGuest
      const { data } = await api.post<AuthResponse>('/auth/login', payload)
      setAuth(data.user, data.accessToken)
      const migratedCount = await migrateGuestDataIfAny(wasGuest, data.user.id)
      return { ...data, migratedCount }
    },
  })
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; name: string }) => {
      const wasGuest = useAuthStore.getState().isGuest
      const { data } = await api.post<AuthResponse>('/auth/register', payload)
      setAuth(data.user, data.accessToken)
      const migratedCount = await migrateGuestDataIfAny(wasGuest, data.user.id)
      return { ...data, migratedCount }
    },
  })
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear)
  return useMutation({
    mutationFn: async () => {
      // Guests never had a server session to revoke.
      if (useAuthStore.getState().isGuest) {
        clear()
        return
      }
      // Logging out is a local action first — clear the cached session even
      // if we can't reach the server to revoke the refresh token (offline).
      try {
        await api.post('/auth/logout')
      } finally {
        clear()
      }
    },
  })
}
