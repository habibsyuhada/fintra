import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAuthStore } from '../lib/auth-store'
import { useAuthReady } from '../lib/auth-provider'
import { useOnlineStatus } from '../lib/network-status'
import { getDb } from '../lib/db'
import { useLogout } from '../api/auth'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/transactions', label: 'Transaksi' },
  { to: '/scan', label: 'Scan Struk' },
  { to: '/recurring', label: 'Tagihan' },
  { to: '/budgets', label: 'Budget' },
  { to: '/reports', label: 'Laporan' },
  { to: '/accounts', label: 'Akun' },
  { to: '/categories', label: 'Kategori' },
]

function SyncStatus({ userId }: { userId: string }) {
  const online = useOnlineStatus()
  const pending = useLiveQuery(() => getDb(userId).syncQueue.count(), [userId])

  if (online && !pending) {
    return <span className="text-xs text-green-600">● Tersinkron</span>
  }

  return (
    <span className={clsx('text-xs', online ? 'text-amber-600' : 'text-gray-500')}>
      {online ? '↻' : '●'} {online ? 'Menyinkronkan' : 'Offline'}
      {pending ? ` (${pending} tertunda)` : ''}
    </span>
  )
}

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const ready = useAuthReady()
  const logout = useLogout()

  if (!ready) {
    return <div className="flex min-h-svh items-center justify-center text-gray-500">Memuat...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Fintra</span>
            <nav className="flex gap-4">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      'text-sm font-medium',
                      isActive
                        ? 'text-indigo-600'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <SyncStatus userId={user.id} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{user.name}</span>
            <button
              onClick={() => logout.mutate()}
              className="text-sm font-medium text-gray-600 hover:text-red-600 dark:text-gray-400"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
