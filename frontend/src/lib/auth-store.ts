import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  name: string
  createdAt: string
}

const CACHED_USER_KEY = 'fintra-cached-user'

/** Persists only the user's profile (never the token) so a returning,
 * already-logged-in user can be recognized while fully offline. Any actual
 * API call still requires a valid access token obtained online. */
export function getCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function setCachedUser(user: AuthUser | null) {
  if (user) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(CACHED_USER_KEY)
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isHydrated: boolean
  /** true when the current session was restored from local cache without a
   * fresh token, because the app started offline. */
  isOfflineSession: boolean
  setAuth: (user: AuthUser, accessToken: string) => void
  restoreOfflineUser: (user: AuthUser) => void
  setHydrated: (hydrated: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,
  isOfflineSession: false,
  setAuth: (user, accessToken) => {
    setCachedUser(user)
    set({ user, accessToken, isOfflineSession: false })
  },
  restoreOfflineUser: (user) => set({ user, accessToken: null, isOfflineSession: true }),
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),
  clear: () => {
    setCachedUser(null)
    set({ user: null, accessToken: null, isOfflineSession: false })
  },
}))
