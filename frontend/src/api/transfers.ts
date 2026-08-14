import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Transfer } from '../lib/types'

export function useTransfers(accountId?: string) {
  return useQuery({
    queryKey: ['transfers', accountId],
    queryFn: async () => (await api.get<Transfer[]>('/transfers', { params: { accountId } })).data,
  })
}

export interface TransferInput {
  fromAccountId: string
  toAccountId: string
  amount: number
  date: string
  note?: string
}

export function useCreateTransfer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TransferInput) => (await api.post<Transfer>('/transfers', payload)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transfers'] })
      void qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
