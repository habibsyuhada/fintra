import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { RecurringFrequency, RecurringRule, TransactionType } from '../lib/types'

export function useRecurringRules() {
  return useQuery({
    queryKey: ['recurring-rules'],
    queryFn: async () => (await api.get<RecurringRule[]>('/recurring-rules')).data,
  })
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
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: RecurringRuleInput) =>
      (await api.post<RecurringRule>('/recurring-rules', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-rules'] }),
  })
}

export function useUpdateRecurringRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<RecurringRuleInput> & { id: string; isActive?: boolean }) =>
      (await api.patch<RecurringRule>(`/recurring-rules/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-rules'] }),
  })
}

export function useDeleteRecurringRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/recurring-rules/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring-rules'] }),
  })
}
