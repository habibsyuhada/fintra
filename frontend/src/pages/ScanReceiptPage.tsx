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
import { useAuthStore } from '../lib/auth-store'
import { formatMoney } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import { CameraIcon, WifiOffIcon } from '../components/ui/icons'

const schema = z.object({
  accountId: z.string().min(1, 'Pilih akun'),
  categoryId: z.string().optional(),
  amount: z.coerce.number().positive('Nominal harus lebih dari 0'),
  date: z.string().min(1),
  note: z.string().optional(),
})
type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

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

  const isGuest = useAuthStore((s) => s.isGuest)
  const online = useOnlineStatus() && !isGuest
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
    <div className="space-y-4">
      <PageHeader
        title="Scan Struk"
        description="Foto struk belanja, AI akan membaca detail transaksinya sebagai draft — kamu tetap perlu mereview sebelum disimpan."
      />

      {!online && (
        <div className="flex items-start gap-2.5 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <WifiOffIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {isGuest
              ? 'Scan struk butuh akun (memanggil AI lewat server) — daftar/masuk dulu untuk memakainya. Sementara itu catat transaksinya secara manual di halaman Transaksi.'
              : 'Scan struk butuh koneksi internet (memanggil model AI). Sambungkan kembali untuk memakainya — atau catat transaksinya secara manual di halaman Transaksi.'}
          </span>
        </div>
      )}

      {!result && (
        <Card className="flex flex-col items-center justify-center gap-4 border-dashed p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
            <CameraIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Belum ada struk yang dipindai</p>
            <p className="mt-1 text-xs text-slate-500">Ambil foto struk untuk mulai membuat draft transaksi otomatis.</p>
          </div>
          <Button onClick={() => void handleCapture()} loading={scanReceipt.isPending} disabled={!online} icon={<CameraIcon className="h-4 w-4" />}>
            {scanReceipt.isPending ? 'Memindai struk...' : 'Ambil Foto Struk'}
          </Button>
          {captureError && <p className="text-sm text-rose-600 dark:text-rose-400">{captureError}</p>}
        </Card>
      )}

      {previewUrl && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <img src={previewUrl} alt="Struk" className="w-full rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800" />
            {result?.draft?.items && result.draft.items.length > 0 && (
              <Card className="mt-4 p-4">
                <p className="text-xs font-semibold text-slate-500">Item terdeteksi</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {result.draft.items.map((item, i) => (
                    <li key={i} className="flex justify-between gap-3 text-slate-700 dark:text-slate-300">
                      <span className="truncate">
                        {item.name}
                        {item.quantity ? ` x${item.quantity}` : ''}
                      </span>
                      <span className="shrink-0 font-mono text-xs">{item.price != null ? formatMoney(item.price) : '-'}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {result && (
            <div>
              {result.error && (
                <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-400">{result.error}</p>
              )}
              <Card className="p-5">
                <form onSubmit={onSubmit} className="space-y-3">
                  <Select label="Akun" {...register('accountId')} error={errors.accountId?.message}>
                    <option value="">Pilih akun</option>
                    {accounts?.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                  <Select label="Kategori" {...register('categoryId')}>
                    <option value="">Tanpa kategori</option>
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Input label="Nominal" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} />
                  <Input label="Tanggal" type="date" {...register('date')} />
                  <Input label="Catatan / Merchant" {...register('note')} />
                  <div className="flex gap-2 pt-2">
                    <Button type="submit" loading={confirmReceipt.isPending} className="flex-1">
                      Simpan sebagai Transaksi
                    </Button>
                    <Button type="button" variant="outline" onClick={handleDiscard}>
                      Buang
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
