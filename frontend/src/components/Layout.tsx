import { useState } from 'react'
import { NavLink, Outlet, Navigate, Link } from 'react-router-dom'
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
  const isGuest = useAuthStore((s) => s.isGuest)
  const ready = useAuthReady()
  const logout = useLogout()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!ready) {
    return <div className="flex min-h-svh items-center justify-center text-gray-500">Memuat...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'text-sm font-medium',
      isActive
        ? 'text-indigo-600'
        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
    )

  return (
    <div className="min-h-svh bg-gray-50 dark:bg-gray-950">
      {isGuest && (
        <div className="bg-amber-50 dark:bg-amber-950 px-4 py-2 text-center text-xs text-amber-700 dark:text-amber-400">
          Mode Tamu — data hanya tersimpan di perangkat ini.{' '}
          <Link to="/login" className="font-medium underline">
            Daftar/Masuk
          </Link>{' '}
          untuk menyinkronkannya ke akun.
        </div>
      )}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Fintra</span>
            <nav className="hidden md:flex gap-4">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              {isGuest ? (
                <span className="text-xs text-gray-500">● Mode Tamu</span>
              ) : (
                <SyncStatus userId={user.id} />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.name}</span>
            </div>
            <button
              onClick={() => logout.mutate()}
              className="hidden md:inline text-sm font-medium text-gray-600 hover:text-red-600 dark:text-gray-400"
            >
              {isGuest ? 'Keluar mode tamu' : 'Keluar'}
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={menuOpen}
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {menuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 px-4 py-3">
            <nav className="flex flex-col gap-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={navLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3 sm:hidden">
              {isGuest ? (
                <span className="text-xs text-gray-500">● Mode Tamu</span>
              ) : (
                <SyncStatus userId={user.id} />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.name}</span>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false)
                logout.mutate()
              }}
              className="mt-3 text-sm font-medium text-gray-600 hover:text-red-600 dark:text-gray-400"
            >
              {isGuest ? 'Keluar mode tamu' : 'Keluar'}
            </button>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
