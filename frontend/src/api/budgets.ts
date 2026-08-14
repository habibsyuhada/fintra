import { useLiveQuery } from 'dexie-react-hooks'
import { useDb } from '../lib/use-db'
import { newLocalId } from '../lib/db'
import { enqueue } from '../lib/sync-engine'
import { computeBudgetStatus } from '../lib/offline-calc'
import type { Budget, BudgetPeriod } from '../lib/types'

export function useBudgets() {
  const db = useDb()
  const data = useLiveQuery(async () => {
    const [budgets, transactions, categories] = await Promise.all([
      db.budgets.toArray(),
      db.transactions.toArray(),
      db.categories.toArray(),
    ])
    const categoryMap = new Map(categories.map((c) => [c.id, c]))
    const withStatus: Budget[] = budgets.map((budget) => {
      const computed = computeBudgetStatus(budget, transactions)
      return {
        ...computed,
        periodStart: computed.periodStart.toISOString(),
        periodEnd: computed.periodEnd.toISOString(),
        category: categoryMap.get(budget.categoryId),
      }
    })
    return withStatus
  }, [db])

  return { data, isLoading: data === undefined }
}

export interface BudgetInput {
  categoryId: string
  amount: number
  period: BudgetPeriod
  startDate: string
}

export function useCreateBudget() {
  const db = useDb()
  return {
    mutate: (payload: BudgetInput, opts?: { onSuccess?: () => void }) => {
      void (async () => {
        const id = newLocalId()
        await db.budgets.put({
          id,
          categoryId: payload.categoryId,
          amount: String(payload.amount),
          period: payload.period,
          startDate: payload.startDate,
          createdAt: new Date().toISOString(),
        })
        await enqueue(db, 'budget', 'create', id, { ...payload })
        opts?.onSuccess?.()
      })()
    },
    isPending: false,
  }
}

export function useDeleteBudget() {
  const db = useDb()
  return {
    mutate: (id: string) => {
      void (async () => {
        await db.budgets.delete(id)
        await enqueue(db, 'budget', 'delete', id)
      })()
    },
  }
}
