import { useLiveQuery } from 'dexie-react-hooks'
import { useDb } from '../lib/use-db'
import { newLocalId } from '../lib/db'
import { enqueue } from '../lib/sync-engine'
import { computeAccountBalance } from '../lib/offline-calc'
import type { Account, AccountType } from '../lib/types'

export function useAccounts() {
  const db = useDb()
  const data = useLiveQuery(async () => {
    const [accounts, transactions, transfers] = await Promise.all([
      db.accounts.toArray(),
      db.transactions.toArray(),
      db.transfers.toArray(),
    ])
    const withBalance: Account[] = accounts.map((account) => ({
      ...account,
      balance: String(computeAccountBalance(account, account.id, transactions, transfers)),
    }))
    return withBalance
  }, [db])

  return { data, isLoading: data === undefined }
}

export interface AccountInput {
  name: string
  type: AccountType
  currency?: string
  initialBalance?: number
}

export function useCreateAccount() {
  const db = useDb()
  return {
    mutate: (payload: AccountInput, opts?: { onSuccess?: () => void }) => {
      void (async () => {
        const id = newLocalId()
        const now = new Date().toISOString()
        await db.accounts.put({
          id,
          name: payload.name,
          type: payload.type,
          currency: payload.currency ?? 'IDR',
          initialBalance: String(payload.initialBalance ?? 0),
          isArchived: false,
          createdAt: now,
          updatedAt: now,
        })
        await enqueue(db, 'account', 'create', id, { ...payload })
        opts?.onSuccess?.()
      })()
    },
    isPending: false,
  }
}

export function useUpdateAccount() {
  const db = useDb()
  return {
    mutate: (payload: Partial<AccountInput> & { id: string; isArchived?: boolean }) => {
      void (async () => {
        const { id, ...changes } = payload
        const existing = await db.accounts.get(id)
        if (!existing) return
        await db.accounts.put({
          ...existing,
          ...changes,
          currency: changes.currency ?? existing.currency,
          initialBalance: changes.initialBalance != null ? String(changes.initialBalance) : existing.initialBalance,
          updatedAt: new Date().toISOString(),
        })
        await enqueue(db, 'account', 'update', id, { ...changes })
      })()
    },
  }
}

export function useDeleteAccount() {
  const db = useDb()
  return {
    mutate: (id: string) => {
      void (async () => {
        await db.accounts.update(id, { isArchived: true })
        await enqueue(db, 'account', 'update', id, { isArchived: true })
      })()
    },
  }
}
