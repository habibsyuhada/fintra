import { useState } from 'react'
import { NavLink, Outlet, Navigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAuthStore } from '../lib/auth-store'
import { useAuthReady } from '../lib/auth-provider'
import { useOnlineStatus } from '../lib/network-status'
import { getDb } from '../lib/db'
import { useLogout } from '../api/auth'
import { useT, type TranslationKey } from '../lib/i18n'
import clsx from 'clsx'

const NAV_ITEMS: { to: string; labelKey: TranslationKey; end?: boolean }[] = [
  { to: '/', labelKey: 'nav.dashboard', end: true },
  { to: '/transactions', labelKey: 'nav.transactions' },
  { to: '/scan', labelKey: 'nav.scan' },
  { to: '/recurring', labelKey: 'nav.recurring' },
  { to: '/budgets', labelKey: 'nav.budgets' },
  { to: '/reports', labelKey: 'nav.reports' },
  { to: '/accounts', labelKey: 'nav.accounts' },
  { to: '/categories', labelKey: 'nav.categories' },
  { to: '/settings', labelKey: 'nav.settings' },
]

function SyncStatus({ userId }: { userId: string }) {
  const online = useOnlineStatus()
  const pending = useLiveQuery(() => getDb(userId).syncQueue.count(), [userId])
  const t = useT()

  if (online && !pending) {
    return <span className="text-xs text-green-600">● {t('layout.synced')}</span>
  }

  return (
    <span className={clsx('text-xs', online ? 'text-amber-600' : 'text-gray-500')}>
      {online ? '↻' : '●'} {online ? t('layout.syncing') : t('layout.offline')}
      {pending ? ` (${pending} ${t('layout.pending')})` : ''}
    </span>
  )
}

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const isGuest = useAuthStore((s) => s.isGuest)
  const ready = useAuthReady()
  const logout = useLogout()
  const [menuOpen, setMenuOpen] = useState(false)
  const t = useT()

  if (!ready) {
    return <div className="flex min-h-svh items-center justify-center text-gray-500">{t('layout.loading')}</div>
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
          {t('layout.guestBanner')}{' '}
          <Link to="/login" className="font-medium underline">
            {t('layout.guestBannerLink')}
          </Link>{' '}
          {t('layout.guestBannerSuffix')}
        </div>
      )}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Fintra</span>
            <nav className="hidden md:flex gap-4">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              {isGuest ? (
                <span className="text-xs text-gray-500">● {t('layout.guestMode')}</span>
              ) : (
                <SyncStatus userId={user.id} />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isGuest ? t('layout.guestName') : user.name}
              </span>
            </div>
            <button
              onClick={() => logout.mutate()}
              className="hidden md:inline text-sm font-medium text-gray-600 hover:text-red-600 dark:text-gray-400"
            >
              {isGuest ? t('layout.logoutGuest') : t('layout.logout')}
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? t('layout.closeMenu') : t('layout.openMenu')}
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
                  {t(item.labelKey)}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3 sm:hidden">
              {isGuest ? (
                <span className="text-xs text-gray-500">● {t('layout.guestMode')}</span>
              ) : (
                <SyncStatus userId={user.id} />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isGuest ? t('layout.guestName') : user.name}
              </span>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false)
                logout.mutate()
              }}
              className="mt-3 text-sm font-medium text-gray-600 hover:text-red-600 dark:text-gray-400"
            >
              {isGuest ? t('layout.logoutGuest') : t('layout.logout')}
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
