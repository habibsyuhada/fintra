import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  name: string
  createdAt: string
}

export const GUEST_USER_ID = 'guest'

const CACHED_USER_KEY = 'fintra-cached-user'
const GUEST_MODE_KEY = 'fintra-guest-mode'

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

export function wasGuestMode(): boolean {
  return localStorage.getItem(GUEST_MODE_KEY) === '1'
}

function setGuestModeFlag(active: boolean) {
  if (active) localStorage.setItem(GUEST_MODE_KEY, '1')
  else localStorage.removeItem(GUEST_MODE_KEY)
}

function makeGuestUser(): AuthUser {
  return { id: GUEST_USER_ID, email: '', name: 'Tamu', createdAt: new Date().toISOString() }
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isHydrated: boolean
  /** true when the current session was restored from local cache without a
   * fresh token, because the app started offline. */
  isOfflineSession: boolean
  /** true when using the app locally without any account — nothing ever
   * syncs to a server until the guest registers or logs in. */
  isGuest: boolean
  setAuth: (user: AuthUser, accessToken: string) => void
  restoreOfflineUser: (user: AuthUser) => void
  continueAsGuest: () => void
  setHydrated: (hydrated: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,
  isOfflineSession: false,
  isGuest: false,
  setAuth: (user, accessToken) => {
    setCachedUser(user)
    setGuestModeFlag(false)
    set({ user, accessToken, isOfflineSession: false, isGuest: false })
  },
  restoreOfflineUser: (user) => set({ user, accessToken: null, isOfflineSession: true, isGuest: false }),
  continueAsGuest: () => {
    setGuestModeFlag(true)
    set({ user: makeGuestUser(), accessToken: null, isOfflineSession: false, isGuest: true })
  },
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),
  clear: () => {
    setCachedUser(null)
    setGuestModeFlag(false)
    set({ user: null, accessToken: null, isOfflineSession: false, isGuest: false })
  },
}))
