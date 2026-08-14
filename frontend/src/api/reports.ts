import { useLiveQuery } from 'dexie-react-hooks'
import { useDb } from '../lib/use-db'
import { computeCashflow, computeCategoryBreakdown, computeTrend } from '../lib/offline-calc'

export function useCashflowReport(year: number = new Date().getFullYear()) {
  const db = useDb()
  const data = useLiveQuery(async () => {
    const transactions = await db.transactions.toArray()
    return computeCashflow(transactions, year)
  }, [db, year])
  return { data, isLoading: data === undefined }
}

export function useCategoryBreakdownReport(type: 'INCOME' | 'EXPENSE' = 'EXPENSE') {
  const db = useDb()
  const data = useLiveQuery(async () => {
    const [transactions, categories] = await Promise.all([db.transactions.toArray(), db.categories.toArray()])
    return computeCategoryBreakdown(transactions, categories, type)
  }, [db, type])
  return { data, isLoading: data === undefined }
}

export function useTrendReport(granularity: 'day' | 'week' | 'month' = 'day') {
  const db = useDb()
  const data = useLiveQuery(async () => {
    const transactions = await db.transactions.toArray()
    return computeTrend(transactions, 'EXPENSE', granularity)
  }, [db, granularity])
  return { data, isLoading: data === undefined }
}
