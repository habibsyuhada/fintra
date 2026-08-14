import { api } from '../lib/api'
import type { TransactionFilters } from './transactions'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export async function downloadTransactionsExport(format: ExportFormat, filters: TransactionFilters = {}) {
  const response = await api.get('/exports/transactions', {
    params: { ...filters, format },
    responseType: 'blob',
  })

  const disposition = response.headers['content-disposition'] as string | undefined
  const match = disposition?.match(/filename="(.+)"/);
  const filename = match?.[1] ?? `fintra-transaksi.${format}`

  const url = window.URL.createObjectURL(response.data as Blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
