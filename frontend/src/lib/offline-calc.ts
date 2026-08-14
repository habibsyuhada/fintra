// Client-side ports of the backend's balance/budget calculations
// (backend/src/accounts/accounts.service.ts, backend/src/budgets/budgets.service.ts).
// Kept in lockstep with those formulas so cached data renders identically
// whether it came from the server or was computed offline.

import type { LocalAccount, LocalBudget, LocalCategory, LocalTransaction, LocalTransfer } from './db'
import type { BudgetPeriod, BudgetStatus, CashflowReport, CategoryBreakdownReport, TrendReport, TransactionType } from './types'

export function computeAccountBalance(
  account: Pick<LocalAccount, 'initialBalance'>,
  accountId: string,
  transactions: LocalTransaction[],
  transfers: LocalTransfer[],
): number {
  let balance = Number(account.initialBalance)
  for (const tx of transactions) {
    if (tx.isDeleted || tx.accountId !== accountId) continue
    if (tx.type === 'INCOME') balance += Number(tx.amount)
    else if (tx.type === 'EXPENSE') balance -= Number(tx.amount)
  }
  for (const tr of transfers) {
    if (tr.toAccountId === accountId) balance += Number(tr.amount)
    if (tr.fromAccountId === accountId) balance -= Number(tr.amount)
  }
  return balance
}

export function currentPeriodWindow(period: BudgetPeriod, now = new Date()): { start: Date; end: Date } {
  if (period === 'WEEKLY') {
    const day = (now.getDay() + 6) % 7 // Monday = 0
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - day)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return { start, end }
  }
  if (period === 'YEARLY') {
    return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) }
  }
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  }
}

export interface BudgetWithStatus extends LocalBudget {
  periodStart: Date
  periodEnd: Date
  spent: number
  remaining: number
  percentage: number
  status: BudgetStatus
}

export function computeBudgetStatus(budget: LocalBudget, transactions: LocalTransaction[]): BudgetWithStatus {
  const { start, end } = currentPeriodWindow(budget.period)
  const spent = transactions
    .filter(
      (tx) =>
        !tx.isDeleted &&
        tx.type === 'EXPENSE' &&
        tx.categoryId === budget.categoryId &&
        new Date(tx.date) >= start &&
        new Date(tx.date) < end,
    )
    .reduce((sum, tx) => sum + Number(tx.amount), 0)

  const amountNum = Number(budget.amount)
  const percentage = amountNum > 0 ? Math.round((spent / amountNum) * 100) : 0
  const status: BudgetStatus = percentage >= 100 ? 'OVER' : percentage >= 80 ? 'NEAR' : 'OK'

  return { ...budget, periodStart: start, periodEnd: end, spent, remaining: amountNum - spent, percentage, status }
}

export function computeCashflow(transactions: LocalTransaction[], year: number): CashflowReport {
  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, income: 0, expense: 0, net: 0 }))
  for (const tx of transactions) {
    if (tx.isDeleted) continue
    const date = new Date(tx.date)
    if (date.getFullYear() !== year) continue
    const bucket = months[date.getMonth()]
    if (tx.type === 'INCOME') bucket.income += Number(tx.amount)
    else if (tx.type === 'EXPENSE') bucket.expense += Number(tx.amount)
  }
  months.forEach((m) => (m.net = m.income - m.expense))
  return { year, months }
}

export function computeCategoryBreakdown(
  transactions: LocalTransaction[],
  categories: LocalCategory[],
  type: TransactionType,
  dateFrom?: string,
  dateTo?: string,
): CategoryBreakdownReport {
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const totals = new Map<string | null, number>()

  for (const tx of transactions) {
    if (tx.isDeleted || tx.type !== type) continue
    if (dateFrom && tx.date < dateFrom) continue
    if (dateTo && tx.date > dateTo) continue
    if (!tx.categoryId) continue
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + Number(tx.amount))
  }

  const total = [...totals.values()].reduce((sum, v) => sum + v, 0)
  const items = [...totals.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      categoryName: (categoryId && categoryMap.get(categoryId)?.name) || 'Tanpa kategori',
      color: (categoryId && categoryMap.get(categoryId)?.color) || null,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return { type, total, items }
}

export function computeTrend(
  transactions: LocalTransaction[],
  type: TransactionType,
  granularity: 'day' | 'week' | 'month',
  dateFrom?: string,
  dateTo?: string,
): TrendReport {
  const end = dateTo ? new Date(dateTo) : new Date()
  const start = dateFrom ? new Date(dateFrom) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

  const bucketKey = (date: Date): string => {
    if (granularity === 'day') return date.toISOString().slice(0, 10)
    if (granularity === 'month') return date.toISOString().slice(0, 7)
    const monday = new Date(date)
    const day = (monday.getDay() + 6) % 7
    monday.setHours(0, 0, 0, 0)
    monday.setDate(monday.getDate() - day)
    return monday.toISOString().slice(0, 10)
  }

  const totals = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.isDeleted || tx.type !== type) continue
    const date = new Date(tx.date)
    if (date < start || date > end) continue
    const key = bucketKey(date)
    totals.set(key, (totals.get(key) ?? 0) + Number(tx.amount))
  }

  const items = [...totals.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, total]) => ({ date, total }))

  return { type, granularity, items }
}
