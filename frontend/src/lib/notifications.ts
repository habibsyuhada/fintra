import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Budget, RecurringRule } from './types'

const NOTIFIED_KEY = 'fintra-notified-ids'
const UPCOMING_BILL_WINDOW_DAYS = 3

function alreadyNotifiedToday(id: string): boolean {
  const raw = sessionStorage.getItem(NOTIFIED_KEY)
  const notified = raw ? (JSON.parse(raw) as string[]) : []
  return notified.includes(id)
}

function markNotified(id: string): void {
  const raw = sessionStorage.getItem(NOTIFIED_KEY)
  const notified = raw ? (JSON.parse(raw) as string[]) : []
  sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify([...notified, id]))
}

function hashToInt(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  const status = await LocalNotifications.checkPermissions()
  if (status.display === 'granted') return true
  const requested = await LocalNotifications.requestPermissions()
  return requested.display === 'granted'
}

export async function notifyBudgetAlerts(budgets: Budget[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const alerting = budgets.filter((b) => b.status === 'NEAR' || b.status === 'OVER')
  if (alerting.length === 0) return

  const granted = await ensureNotificationPermission()
  if (!granted) return

  const toSend = alerting.filter((b) => !alreadyNotifiedToday(`budget:${b.id}`))
  if (toSend.length === 0) return

  await LocalNotifications.schedule({
    notifications: toSend.map((budget) => ({
      id: hashToInt(`budget:${budget.id}`),
      title: budget.status === 'OVER' ? 'Budget terlampaui' : 'Budget mendekati limit',
      body: `${budget.category?.name ?? 'Kategori'}: ${budget.percentage}% terpakai (${budget.status === 'OVER' ? 'lewat' : 'mendekati'} limit)`,
      schedule: { at: new Date(Date.now() + 1000) },
    })),
  })
  toSend.forEach((b) => markNotified(`budget:${b.id}`))
}

export async function notifyUpcomingBills(rules: RecurringRule[]): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  const now = Date.now()
  const windowMs = UPCOMING_BILL_WINDOW_DAYS * 24 * 60 * 60 * 1000

  const upcoming = rules.filter((r) => {
    if (!r.isActive) return false
    const due = new Date(r.nextRunDate).getTime()
    return due >= now && due - now <= windowMs
  })
  if (upcoming.length === 0) return

  const granted = await ensureNotificationPermission()
  if (!granted) return

  const toSend = upcoming.filter((r) => !alreadyNotifiedToday(`bill:${r.id}`))
  if (toSend.length === 0) return

  await LocalNotifications.schedule({
    notifications: toSend.map((rule) => ({
      id: hashToInt(`bill:${rule.id}`),
      title: 'Tagihan akan jatuh tempo',
      body: `${rule.note ?? rule.category?.name ?? 'Tagihan'} — ${new Date(rule.nextRunDate).toLocaleDateString('id-ID')}`,
      schedule: { at: new Date(Date.now() + 1000) },
    })),
  })
  toSend.forEach((r) => markNotified(`bill:${r.id}`))
}
