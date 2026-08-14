import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { CashflowReport, CategoryBreakdownReport, TrendReport } from '../lib/types'

export function useCashflowReport(year?: number) {
  return useQuery({
    queryKey: ['reports', 'cashflow', year],
    queryFn: async () => (await api.get<CashflowReport>('/reports/cashflow', { params: { year } })).data,
  })
}

export function useCategoryBreakdownReport(type: 'INCOME' | 'EXPENSE' = 'EXPENSE') {
  return useQuery({
    queryKey: ['reports', 'category-breakdown', type],
    queryFn: async () =>
      (await api.get<CategoryBreakdownReport>('/reports/category-breakdown', { params: { type } })).data,
  })
}

export function useTrendReport(granularity: 'day' | 'week' | 'month' = 'day') {
  return useQuery({
    queryKey: ['reports', 'trend', granularity],
    queryFn: async () => (await api.get<TrendReport>('/reports/trend', { params: { granularity } })).data,
  })
}
