import { useLiveQuery } from 'dexie-react-hooks'
import { useDb } from '../lib/use-db'
import { newLocalId } from '../lib/db'
import { enqueue } from '../lib/sync-engine'
import type { RecurringFrequency, RecurringRule, TransactionType } from '../lib/types'

export function useRecurringRules() {
  const db = useDb()
  const data = useLiveQuery(async () => {
    const [rules, accounts, categories] = await Promise.all([
      db.recurringRules.toArray(),
      db.accounts.toArray(),
      db.categories.toArray(),
    ])
    const accountMap = new Map(accounts.map((a) => [a.id, a]))
    const categoryMap = new Map(categories.map((c) => [c.id, c]))
    const withJoins: RecurringRule[] = rules
      .sort((a, b) => (a.nextRunDate < b.nextRunDate ? -1 : 1))
      .map((rule) => ({
        ...rule,
        account: accountMap.get(rule.accountId) && { id: rule.accountId, name: accountMap.get(rule.accountId)!.name },
        category: rule.categoryId ? categoryMap.get(rule.categoryId) : null,
      }))
    return withJoins
  }, [db])

  return { data, isLoading: data === undefined }
}

export interface RecurringRuleInput {
  accountId: string
  categoryId?: string
  amount: number
  type: TransactionType
  note?: string
  frequency: RecurringFrequency
  nextRunDate: string
}

export function useCreateRecurringRule() {
  const db = useDb()
  return {
    mutate: (payload: RecurringRuleInput, opts?: { onSuccess?: () => void }) => {
      void (async () => {
        const id = newLocalId()
        await db.recurringRules.put({
          id,
          accountId: payload.accountId,
          categoryId: payload.categoryId ?? null,
          amount: String(payload.amount),
          type: payload.type,
          note: payload.note ?? null,
          frequency: payload.frequency,
          nextRunDate: payload.nextRunDate,
          isActive: true,
        })
        await enqueue(db, 'recurringRule', 'create', id, { ...payload })
        opts?.onSuccess?.()
      })()
    },
    isPending: false,
  }
}

export function useUpdateRecurringRule() {
  const db = useDb()
  return {
    mutate: (payload: Partial<RecurringRuleInput> & { id: string; isActive?: boolean }) => {
      void (async () => {
        const { id, ...changes } = payload
        const existing = await db.recurringRules.get(id)
        if (!existing) return
        await db.recurringRules.put({
          ...existing,
          ...changes,
          categoryId: changes.categoryId ?? existing.categoryId,
          amount: changes.amount != null ? String(changes.amount) : existing.amount,
        })
        await enqueue(db, 'recurringRule', 'update', id, { ...changes })
      })()
    },
  }
}

export function useDeleteRecurringRule() {
  const db = useDb()
  return {
    mutate: (id: string) => {
      void (async () => {
        await db.recurringRules.delete(id)
        await enqueue(db, 'recurringRule', 'delete', id)
      })()
    },
  }
}
