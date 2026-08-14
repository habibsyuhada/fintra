import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Budget, BudgetPeriod } from '../lib/types'

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => (await api.get<Budget[]>('/budgets')).data,
  })
}

export interface BudgetInput {
  categoryId: string
  amount: number
  period: BudgetPeriod
  startDate: string
}

export function useCreateBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: BudgetInput) => (await api.post<Budget>('/budgets', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}

export function useDeleteBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/budgets/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })
}
