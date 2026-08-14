import { useEffect, useState } from 'react'
import { NavLink, Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAuthStore } from '../lib/auth-store'
import { useAuthReady } from '../lib/auth-provider'
import { useOnlineStatus } from '../lib/network-status'
import { getDb } from '../lib/db'
import { useLogout } from '../api/auth'
import clsx from 'clsx'
import { Spinner } from './ui/Spinner'
import {
  HomeIcon,
  ReceiptListIcon,
  CameraIcon,
  RepeatIcon,
  PiggyIcon,
  ChartPieIcon,
  WalletIcon,
  TagIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  RefreshIcon,
  WifiOffIcon,
  CheckCircleIcon,
} from './ui/icons'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true, icon: HomeIcon },
  { to: '/transactions', label: 'Transaksi', icon: ReceiptListIcon },
  { to: '/scan', label: 'Scan Struk', icon: CameraIcon },
  { to: '/recurring', label: 'Tagihan', icon: RepeatIcon },
  { to: '/budgets', label: 'Budget', icon: PiggyIcon },
  { to: '/reports', label: 'Laporan', icon: ChartPieIcon },
  { to: '/accounts', label: 'Akun', icon: WalletIcon },
  { to: '/categories', label: 'Kategori', icon: TagIcon },
]

const GUEST_BANNER_DISMISSED_KEY = 'fintra-guest-banner-dismissed'

function SyncStatus({ userId }: { userId: string }) {
  const online = useOnlineStatus()
  const pending = useLiveQuery(() => getDb(userId).syncQueue.count(), [userId])

  if (online && !pending) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircleIcon className="h-3.5 w-3.5" /> Tersinkron
      </span>
    )
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        online ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500',
      )}
    >
      {online ? <RefreshIcon className="h-3.5 w-3.5 animate-spin" /> : <WifiOffIcon className="h-3.5 w-3.5" />}
      {online ? 'Menyinkronkan' : 'Offline'}
      {pending ? ` (${pending} tertunda)` : ''}
    </span>
  )
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function MobileMenuOverlay({
  onClose,
  user,
  isGuest,
  onLogout,
}: {
  onClose: () => void
  user: { id: string; name: string }
  isGuest: boolean
  onLogout: () => void
}) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-base font-medium transition-colors',
      isActive
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
        : 'text-slate-700 active:bg-slate-100 dark:text-slate-300 dark:active:bg-slate-800',
    )

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-white lg:hidden dark:bg-slate-950">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-sm font-bold text-white">
            F
          </div>
          <span className="font-display text-base font-bold text-slate-900 dark:text-slate-100">Fintra</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Tutup menu"
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-2">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass} onClick={onClose}>
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
        <div className="flex items-center gap-3 px-1 pb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{user.name}</p>
            {isGuest ? <span className="text-xs text-slate-500">Mode Tamu</span> : <SyncStatus userId={user.id} />}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-100 dark:bg-rose-950 dark:hover:bg-rose-900/60"
        >
          <LogoutIcon className="h-4 w-4" />
          {isGuest ? 'Keluar mode tamu' : 'Keluar'}
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const user = useAuthStore((s) => s.user)
  const isGuest = useAuthStore((s) => s.isGuest)
  const ready = useAuthReady()
  const logout = useLogout()
  const [menuOpen, setMenuOpen] = useState(false)
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(GUEST_BANNER_DISMISSED_KEY) === '1',
  )
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center gap-2 bg-slate-50 text-slate-500 dark:bg-slate-950">
        <Spinner className="h-5 w-5" /> Memuat...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const activePage = NAV_ITEMS.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100',
    )

  const dismissGuestBanner = () => {
    setGuestBannerDismissed(true)
    localStorage.setItem(GUEST_BANNER_DISMISSED_KEY, '1')
  }

  return (
    <div className="min-h-svh bg-slate-50 dark:bg-slate-950">
      {isGuest && !guestBannerDismissed && (
        <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-400">
          <p className="flex-1">
            Mode Tamu — data hanya tersimpan di perangkat ini.{' '}
            <Link to="/login" className="font-semibold underline underline-offset-2">
              Daftar/Masuk
            </Link>{' '}
            untuk menyinkronkannya ke akun.
          </p>
          <button
            onClick={dismissGuestBanner}
            aria-label="Tutup pemberitahuan"
            className="shrink-0 rounded-md p-1 text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="mx-auto flex max-w-[1400px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-slate-200 bg-white/70 backdrop-blur-sm lg:flex dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-base font-bold text-white shadow-md shadow-indigo-600/25">
              F
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Fintra</span>
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-100 px-3 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {initials(user.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{user.name}</p>
                {isGuest ? (
                  <span className="text-xs text-slate-500">Mode Tamu</span>
                ) : (
                  <SyncStatus userId={user.id} />
                )}
              </div>
              <button
                onClick={() => logout.mutate()}
                aria-label={isGuest ? 'Keluar mode tamu' : 'Keluar'}
                title={isGuest ? 'Keluar mode tamu' : 'Keluar'}
                className="rounded-md p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
              >
                <LogoutIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-sm lg:hidden dark:border-slate-800 dark:bg-slate-900/85">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-sm font-bold text-white">
                  F
                </div>
                <span className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  {activePage?.label ?? 'Fintra'}
                </span>
              </div>
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Buka menu"
                aria-expanded={menuOpen}
                className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-slate-200 bg-white/95 backdrop-blur-sm lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {menuOpen && (
        <MobileMenuOverlay
          onClose={() => setMenuOpen(false)}
          user={user}
          isGuest={isGuest}
          onLogout={() => {
            setMenuOpen(false)
            logout.mutate()
          }}
        />
      )}
    </div>
  )
}
