import axios, { AxiosError, isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from './auth-store'

// Same-origin `/api` by default (VPS deploy: Nginx proxies /api to the
// backend on the same domain). Override at build time with
// VITE_API_BASE_URL when the frontend is hosted separately from the
// backend (e.g. a static GitHub Pages deploy) — leave unset to run
// frontend-only / guest-mode-only, since every request will simply fail
// as a network error and the app already handles that gracefully.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
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
    `${API_BASE_URL}/auth/refresh`,
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
          window.location.href = `${import.meta.env.BASE_URL}login`
        }
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)
