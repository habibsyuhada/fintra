import { useLiveQuery } from 'dexie-react-hooks'
import { useDb } from '../lib/use-db'
import type { Transaction, Transfer, TransactionType } from '../lib/types'

export type FeedTypeFilter = TransactionType | 'TRANSFER' | ''

export type FeedItem =
  | ({ kind: 'transaction' } & Transaction)
  | ({ kind: 'transfer' } & Transfer)

export interface FeedFilters {
  type?: FeedTypeFilter
  limit?: number
}

export interface FeedPage {
  items: FeedItem[]
  total: number
}

/** Riwayat gabungan: transaksi (income/expense) dan transfer antar akun,
 * diurutkan dari yang terbaru. Transfer disimpan di tabel terpisah, jadi
 * daftar yang hanya membaca db.transactions tidak akan pernah memuatnya. */
export function useTransactionFeed(filters: FeedFilters = {}) {
  const db = useDb()
  const data = useLiveQuery(async () => {
    const [transactions, transfers, accounts, categories] = await Promise.all([
      db.transactions.toArray(),
      db.transfers.toArray(),
      db.accounts.toArray(),
      db.categories.toArray(),
    ])
    const accountMap = new Map(accounts.map((a) => [a.id, a]))
    const categoryMap = new Map(categories.map((c) => [c.id, c]))

    const txItems: FeedItem[] =
      filters.type === 'TRANSFER'
        ? []
        : transactions
            .filter((tx) => !tx.isDeleted && (!filters.type || tx.type === filters.type))
            .map((tx) => {
              const account = accountMap.get(tx.accountId)
              return {
                kind: 'transaction' as const,
                ...tx,
                account: account ? { id: account.id, name: account.name, currency: account.currency } : undefined,
                category: (tx.categoryId && categoryMap.get(tx.categoryId)) || null,
              }
            })

    const transferItems: FeedItem[] =
      !filters.type || filters.type === 'TRANSFER'
        ? transfers.map((t) => {
            const from = accountMap.get(t.fromAccountId)
            const to = accountMap.get(t.toAccountId)
            return {
              kind: 'transfer' as const,
              ...t,
              fromAccount: from && { id: from.id, name: from.name },
              toAccount: to && { id: to.id, name: to.name },
            }
          })
        : []

    const merged = [...txItems, ...transferItems].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : a.createdAt < b.createdAt ? 1 : -1,
    )

    const total = merged.length
    const page: FeedPage = { items: filters.limit ? merged.slice(0, filters.limit) : merged, total }
    return page
  }, [db, filters.type, filters.limit])

  return { data, isLoading: data === undefined }
}
