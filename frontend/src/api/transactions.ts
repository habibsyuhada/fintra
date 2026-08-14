import { useLiveQuery } from 'dexie-react-hooks'
import { useDb } from '../lib/use-db'
import { newLocalId } from '../lib/db'
import { enqueue } from '../lib/sync-engine'
import type { Transaction, TransactionPage, TransactionType } from '../lib/types'

export interface TransactionFilters {
  accountId?: string
  categoryId?: string
  type?: TransactionType
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export function useTransactions(filters: TransactionFilters = {}) {
  const db = useDb()
  const data = useLiveQuery(async () => {
    const [transactions, accounts, categories] = await Promise.all([
      db.transactions.toArray(),
      db.accounts.toArray(),
      db.categories.toArray(),
    ])
    const accountMap = new Map(accounts.map((a) => [a.id, a]))
    const categoryMap = new Map(categories.map((c) => [c.id, c]))

    let filtered = transactions.filter((tx) => !tx.isDeleted)
    if (filters.accountId) filtered = filtered.filter((tx) => tx.accountId === filters.accountId)
    if (filters.categoryId) filtered = filtered.filter((tx) => tx.categoryId === filters.categoryId)
    if (filters.type) filtered = filtered.filter((tx) => tx.type === filters.type)
    if (filters.dateFrom) filtered = filtered.filter((tx) => tx.date >= filters.dateFrom!)
    if (filters.dateTo) filtered = filtered.filter((tx) => tx.date <= filters.dateTo!)

    filtered.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

    const limit = filters.limit ?? 50
    const page = filters.page ?? 1
    const total = filtered.length
    const items: Transaction[] = filtered.slice((page - 1) * limit, page * limit).map((tx) => {
      const account = accountMap.get(tx.accountId)
      const category = tx.categoryId ? categoryMap.get(tx.categoryId) : null
      return {
        ...tx,
        account: account ? { id: account.id, name: account.name, currency: account.currency } : undefined,
        category: category ?? null,
      }
    })

    const page_: TransactionPage = { items, total, page, limit, totalPages: Math.ceil(total / limit) }
    return page_
  }, [db, filters.accountId, filters.categoryId, filters.type, filters.dateFrom, filters.dateTo, filters.page, filters.limit])

  return { data, isLoading: data === undefined }
}

export interface TransactionInput {
  accountId: string
  categoryId?: string
  amount: number
  type: TransactionType
  note?: string
  date: string
  tags?: string[]
  originalAmount?: number
  originalCurrency?: string
  exchangeRate?: number
}

export function useCreateTransaction() {
  const db = useDb()
  return {
    mutate: (payload: TransactionInput, opts?: { onSuccess?: () => void }) => {
      void (async () => {
        const id = newLocalId()
        await db.transactions.put({
          id,
          accountId: payload.accountId,
          categoryId: payload.categoryId ?? null,
          amount: String(payload.amount),
          type: payload.type,
          note: payload.note ?? null,
          date: payload.date,
          attachmentUrl: null,
          tags: payload.tags ?? [],
          isDeleted: false,
          isRecurringInstance: false,
          recurringRuleId: null,
          originalAmount: payload.originalAmount != null ? String(payload.originalAmount) : null,
          originalCurrency: payload.originalCurrency ?? null,
          exchangeRate: payload.exchangeRate != null ? String(payload.exchangeRate) : null,
          createdAt: new Date().toISOString(),
        })
        await enqueue(db, 'transaction', 'create', id, { ...payload })
        opts?.onSuccess?.()
      })()
    },
    isPending: false,
  }
}

export function useUpdateTransaction() {
  const db = useDb()
  return {
    mutate: (payload: Partial<TransactionInput> & { id: string }) => {
      void (async () => {
        const { id, ...changes } = payload
        const existing = await db.transactions.get(id)
        if (!existing) return
        await db.transactions.put({
          ...existing,
          ...changes,
          amount: changes.amount != null ? String(changes.amount) : existing.amount,
          categoryId: changes.categoryId ?? existing.categoryId,
          originalAmount: changes.originalAmount != null ? String(changes.originalAmount) : existing.originalAmount,
          exchangeRate: changes.exchangeRate != null ? String(changes.exchangeRate) : existing.exchangeRate,
        })
        await enqueue(db, 'transaction', 'update', id, { ...changes })
      })()
    },
  }
}

export function useDeleteTransaction() {
  const db = useDb()
  return {
    mutate: (id: string) => {
      void (async () => {
        await db.transactions.update(id, { isDeleted: true })
        await enqueue(db, 'transaction', 'delete', id)
      })()
    },
  }
}
