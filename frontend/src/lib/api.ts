import axios, { AxiosError, isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from './auth-store'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const { data } = await axios.post<{ accessToken: string; user: AuthUserResponse }>(
    '/api/auth/refresh',
    {},
    { withCredentials: true },
  )
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  return data.accessToken
}

interface AuthUserResponse {
  id: string
  email: string
  name: string
  createdAt: string
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/register');

    if (error.response?.status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        const token = await refreshPromise
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch (refreshError) {
        // Only force a logout when the server explicitly rejected the
        // refresh (invalid/expired session). A network failure here just
        // means we're offline — keep the cached session so offline pages
        // keep working, and let the app retry later.
        if (isAxiosError(refreshError) && refreshError.response) {
          useAuthStore.getState().clear()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)
