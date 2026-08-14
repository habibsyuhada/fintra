import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
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
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => (await api.get<TransactionPage>('/transactions', { params: filters })).data,
  })
}

export interface TransactionInput {
  accountId: string
  categoryId?: string
  amount: number
  type: TransactionType
  note?: string
  date: string
  tags?: string[]
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TransactionInput) =>
      (await api.post<Transaction>('/transactions', payload)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions'] })
      void qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<TransactionInput> & { id: string }) =>
      (await api.patch<Transaction>(`/transactions/${id}`, payload)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions'] })
      void qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/transactions/${id}`)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions'] })
      void qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
