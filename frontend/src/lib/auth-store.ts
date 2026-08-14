import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  name: string
  createdAt: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isHydrated: boolean
  setAuth: (user: AuthUser, accessToken: string) => void
  setHydrated: (hydrated: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  setHydrated: (hydrated) => set({ isHydrated: hydrated }),
  clear: () => set({ user: null, accessToken: null }),
}))
