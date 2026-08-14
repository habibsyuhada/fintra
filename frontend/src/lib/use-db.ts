import { useAuthStore } from './auth-store'
import { getDb } from './db'

/** Local database scoped to the current user. Only call from components that
 * render after auth is resolved (i.e. inside the authenticated app shell). */
export function useDb() {
  const userId = useAuthStore((s) => s.user?.id)
  if (!userId) {
    throw new Error('useDb() called before a user is authenticated')
  }
  return getDb(userId)
}
