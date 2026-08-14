import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { captureReceiptImage } from '../lib/capture-receipt'
import { useAccounts } from '../api/accounts'
import { useCategories } from '../api/categories'
import { useConfirmReceipt, useRejectReceipt, useScanReceipt, type ScanReceiptResult } from '../api/receipts'
import { useOnlineStatus } from '../lib/network-status'

const schema = z.object({
  accountId: z.string().min(1, 'Pilih akun'),
  categoryId: z.string().optional(),
  amount: z.coerce.number().positive('Nominal harus lebih dari 0'),
  date: z.string().min(1),
  note: z.string().optional(),
})
type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

function formatMoney(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    amount,
  )
}

export default function ScanReceiptPage() {
  const navigate = useNavigate()
  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const scanReceipt = useScanReceipt()
  const confirmReceipt = useConfirmReceipt()
  const rejectReceipt = useRejectReceipt()

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<ScanReceiptResult | null>(null)
  const [captureError, setCaptureError] = useState<string | null>(null)

  const online = useOnlineStatus()
  const expenseCategories = useMemo(() => categories?.filter((c) => c.type === 'EXPENSE') ?? [], [categories])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({ resolver: zodResolver(schema) })

  const handleCapture = async () => {
    setCaptureError(null)
    try {
      const file = await captureReceiptImage()
      setPreviewUrl(URL.createObjectURL(file))
      const scanResult = await scanReceipt.mutateAsync(file)
      setResult(scanResult)

      const draft = scanResult.draft
      const matchedCategory = draft?.category_guess
        ? expenseCategories.find((c) => c.name.toLowerCase() === draft.category_guess?.toLowerCase())
        : undefined

      reset({
        accountId: accounts?.[0]?.id ?? '',
        categoryId: matchedCategory?.id ?? '',
        amount: draft?.total ?? undefined,
        date: (draft?.date ?? new Date().toISOString()).slice(0, 10),
        note: draft?.merchant ?? '',
      })
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Gagal mengambil/memindai foto struk')
    }
  }

  const onSubmit = handleSubmit((values) => {
    if (!result) return
    confirmReceipt.mutate(
      { receiptId: result.receipt.id, ...values, type: 'EXPENSE', accountId: values.accountId },
      { onSuccess: () => navigate('/transactions') },
    )
  })

  const handleDiscard = () => {
    if (result) rejectReceipt.mutate(result.receipt.id)
    setResult(null)
    setPreviewUrl(null)
    reset({})
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Scan Struk</h1>
      <p className="mt-1 text-sm text-gray-500">
        Foto struk belanja, AI akan membaca detail transaksinya sebagai draft — kamu tetap perlu mereview
        sebelum disimpan.
      </p>

      {!online && (
        <p className="mt-4 rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
          Scan struk butuh koneksi internet (memanggil model AI). Sambungkan kembali untuk memakainya — atau catat
          transaksinya secara manual di halaman Transaksi.
        </p>
      )}

      {!result && (
        <div className="mt-6">
          <button
            onClick={handleCapture}
            disabled={scanReceipt.isPending || !online}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {scanReceipt.isPending ? 'Memindai struk...' : '📷 Ambil Foto Struk'}
          </button>
          {captureError && <p className="mt-2 text-sm text-red-600">{captureError}</p>}
        </div>
      )}

      {previewUrl && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <img src={previewUrl} alt="Struk" className="w-full rounded-lg border border-gray-200 dark:border-gray-800" />
            {result?.draft?.items && result.draft.items.length > 0 && (
              <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
                <p className="text-xs font-semibold text-gray-500">Item terdeteksi</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {result.draft.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>{item.name}{item.quantity ? ` x${item.quantity}` : ''}</span>
                      <span>{item.price != null ? formatMoney(item.price) : '-'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {result && (
            <div>
              {result.error && (
                <p className="mb-3 rounded-md bg-amber-50 dark:bg-amber-950 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                  {result.error}
                </p>
              )}
              <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Akun</label>
                  <select {...register('accountId')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm">
                    <option value="">Pilih akun</option>
                    {accounts?.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {errors.accountId && <p className="mt-1 text-xs text-red-600">{errors.accountId.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Kategori</label>
                  <select {...register('categoryId')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm">
                    <option value="">Tanpa kategori</option>
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nominal</label>
                  <input type="number" step="0.01" {...register('amount')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
                  {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Tanggal</label>
                  <input type="date" {...register('date')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Catatan / Merchant</label>
                  <input {...register('note')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={confirmReceipt.isPending}
                    className="flex-1 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    Simpan sebagai Transaksi
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Buang
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
