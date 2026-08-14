import { useLiveQuery } from 'dexie-react-hooks'
import { useDb } from '../lib/use-db'
import { newLocalId } from '../lib/db'
import { enqueue } from '../lib/sync-engine'
import type { Transfer } from '../lib/types'

export function useTransfers(accountId?: string) {
  const db = useDb()
  const data = useLiveQuery(async () => {
    const [transfers, accounts] = await Promise.all([db.transfers.toArray(), db.accounts.toArray()])
    const accountMap = new Map(accounts.map((a) => [a.id, a]))
    const filtered = accountId
      ? transfers.filter((t) => t.fromAccountId === accountId || t.toAccountId === accountId)
      : transfers
    const withAccounts: Transfer[] = filtered
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map((t) => ({
        ...t,
        fromAccount: accountMap.get(t.fromAccountId) && { id: t.fromAccountId, name: accountMap.get(t.fromAccountId)!.name },
        toAccount: accountMap.get(t.toAccountId) && { id: t.toAccountId, name: accountMap.get(t.toAccountId)!.name },
      }))
    return withAccounts
  }, [db, accountId])

  return { data, isLoading: data === undefined }
}

export interface TransferInput {
  fromAccountId: string
  toAccountId: string
  amount: number
  date: string
  note?: string
}

export function useCreateTransfer() {
  const db = useDb()
  return {
    mutate: (payload: TransferInput, opts?: { onSuccess?: () => void }) => {
      void (async () => {
        const id = newLocalId()
        await db.transfers.put({
          id,
          fromAccountId: payload.fromAccountId,
          toAccountId: payload.toAccountId,
          amount: String(payload.amount),
          date: payload.date,
          note: payload.note ?? null,
          createdAt: new Date().toISOString(),
        })
        await enqueue(db, 'transfer', 'create', id, { ...payload })
        opts?.onSuccess?.()
      })()
    },
    isPending: false,
  }
}
