import { useEffect } from 'react'
import { create } from 'zustand'
import { api } from './api'

interface NetworkState {
  online: boolean
  setOnline: (online: boolean) => void
}

export const useNetworkStore = create<NetworkState>((set) => ({
  online: navigator.onLine,
  setOnline: (online) => set({ online }),
}))

/** Verifies real connectivity to the backend, not just navigator.onLine (which
 * only reflects link-layer status, e.g. it stays true on a wifi network with
 * no actual internet). */
export async function pingBackend(): Promise<boolean> {
  try {
    await api.get('/health', { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

export function useOnlineStatus(): boolean {
  const online = useNetworkStore((s) => s.online)
  return online
}

/** Wires browser online/offline events (and an initial ping) into the store.
 * Mount once near the app root. */
export function useNetworkStatusEffect() {
  const setOnline = useNetworkStore((s) => s.setOnline)

  useEffect(() => {
    const handleOnline = () => {
      void pingBackend().then(setOnline)
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    void pingBackend().then(setOnline)

    const interval = setInterval(() => {
      void pingBackend().then(setOnline)
    }, 30_000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [setOnline])
}
