import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore, type AuthUser } from '../lib/auth-store'

interface AuthResponse {
  user: AuthUser
  accessToken: string
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const { data } = await api.post<AuthResponse>('/auth/login', payload)
      return data
    },
    onSuccess: (data) => setAuth(data.user, data.accessToken),
  })
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: async (payload: { email: string; password: string; name: string }) => {
      const { data } = await api.post<AuthResponse>('/auth/register', payload)
      return data
    },
    onSuccess: (data) => setAuth(data.user, data.accessToken),
  })
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear)
  return useMutation({
    mutationFn: async () => {
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
