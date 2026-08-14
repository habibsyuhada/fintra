import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface ReceiptDraft {
  merchant: string | null
  date: string | null
  total: number | null
  items: { name: string; price: number | null; quantity: number | null }[]
  category_guess: string | null
}

export interface Receipt {
  id: string
  imageUrl: string
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED'
  transactionId: string | null
}

export interface ScanReceiptResult {
  receipt: Receipt
  draft: ReceiptDraft | null
  error?: string
}

export function useScanReceipt() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post<ScanReceiptResult>('/receipts/scan', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
  })
}

export interface ConfirmReceiptInput {
  receiptId: string
  accountId: string
  categoryId?: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  note?: string
  date: string
}

export function useConfirmReceipt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ receiptId, ...payload }: ConfirmReceiptInput) =>
      (await api.post(`/receipts/${receiptId}/confirm`, payload)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions'] })
      void qc.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useRejectReceipt() {
  return useMutation({
    mutationFn: async (receiptId: string) => (await api.post(`/receipts/${receiptId}/reject`)).data,
  })
}
