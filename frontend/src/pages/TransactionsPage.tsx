import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAccounts } from '../api/accounts'
import { useCategories } from '../api/categories'
import { useCreateTransaction, useDeleteTransaction, useTransactions } from '../api/transactions'
import { useCreateTransfer } from '../api/transfers'
import { downloadTransactionsExport, type ExportFormat } from '../api/exports'
import { useOnlineStatus } from '../lib/network-status'
import { useAuthStore } from '../lib/auth-store'
import type { TransactionType } from '../lib/types'
import { formatMoney, formatDate } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingRows } from '../components/ui/Spinner'
import { PlusIcon, ArrowsRightLeftIcon, DownloadIcon, TrashIcon, InboxIcon } from '../components/ui/icons'
import clsx from 'clsx'

const txSchema = z.object({
  accountId: z.string().min(1, 'Pilih akun'),
  categoryId: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().positive('Nominal harus lebih dari 0'),
  date: z.string().min(1),
  note: z.string().optional(),
})
type TxFormValues = z.input<typeof txSchema>
type TxFormOutput = z.output<typeof txSchema>

const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'Pilih akun asal'),
  toAccountId: z.string().min(1, 'Pilih akun tujuan'),
  amount: z.coerce.number().positive('Nominal harus lebih dari 0'),
  date: z.string().min(1),
  note: z.string().optional(),
})
type TransferFormValues = z.input<typeof transferSchema>
type TransferFormOutput = z.output<typeof transferSchema>

function TransactionForm({ onDone }: { onDone: () => void }) {
  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const createTransaction = useCreateTransaction()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TxFormValues, unknown, TxFormOutput>({
    resolver: zodResolver(txSchema),
    defaultValues: { type: 'EXPENSE', date: new Date().toISOString().slice(0, 10) },
  })
  const type = watch('type')

  const onSubmit = handleSubmit((values) => {
    createTransaction.mutate(
      {
        ...values,
        categoryId: values.categoryId || undefined,
        date: new Date(values.date).toISOString(),
      },
      { onSuccess: () => { reset(); onDone() } },
    )
  })

  const filteredCategories = categories?.filter((c) => c.type === type) ?? []

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Select label="Tipe" {...register('type')}>
        <option value="EXPENSE">Pengeluaran</option>
        <option value="INCOME">Pemasukan</option>
      </Select>
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
        {filteredCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Input label="Nominal" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} />
      <Input label="Tanggal" type="date" {...register('date')} />
      <Input label="Catatan" {...register('note')} />
      <div className="sm:col-span-3">
        <Button type="submit" loading={createTransaction.isPending}>
          Simpan Transaksi
        </Button>
      </div>
    </form>
  )
}

function TransferForm({ onDone }: { onDone: () => void }) {
  const { data: accounts } = useAccounts()
  const createTransfer = useCreateTransfer()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransferFormValues, unknown, TransferFormOutput>({
    resolver: zodResolver(transferSchema),
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const onSubmit = handleSubmit((values) => {
    createTransfer.mutate(
      { ...values, date: new Date(values.date).toISOString() },
      { onSuccess: () => { reset(); onDone() } },
    )
  })

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Select label="Dari Akun" {...register('fromAccountId')} error={errors.fromAccountId?.message}>
        <option value="">Pilih akun</option>
        {accounts?.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </Select>
      <Select label="Ke Akun" {...register('toAccountId')} error={errors.toAccountId?.message}>
        <option value="">Pilih akun</option>
        {accounts?.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </Select>
      <Input label="Nominal" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} />
      <Input label="Tanggal" type="date" {...register('date')} />
      <Input label="Catatan" {...register('note')} />
      <div className="sm:col-span-3">
        <Button type="submit" loading={createTransfer.isPending}>
          Simpan Transfer
        </Button>
      </div>
    </form>
  )
}

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState<false | 'transaction' | 'transfer'>(false)
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('')
  const { data, isLoading } = useTransactions({ type: typeFilter || undefined })
  const deleteTransaction = useDeleteTransaction()
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const isGuest = useAuthStore((s) => s.isGuest)
  const online = useOnlineStatus() && !isGuest

  const handleExport = async (format: ExportFormat) => {
    setExporting(format)
    try {
      await downloadTransactionsExport(format, { type: typeFilter || undefined })
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transaksi"
        description="Catat pemasukan, pengeluaran, dan transfer antar akun."
        actions={
          <>
            <Button
              variant={showForm === 'transaction' ? 'secondary' : 'primary'}
              icon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setShowForm(showForm === 'transaction' ? false : 'transaction')}
            >
              {showForm === 'transaction' ? 'Batal' : 'Transaksi'}
            </Button>
            <Button
              variant="outline"
              icon={<ArrowsRightLeftIcon className="h-4 w-4" />}
              onClick={() => setShowForm(showForm === 'transfer' ? false : 'transfer')}
            >
              {showForm === 'transfer' ? 'Batal' : 'Transfer'}
            </Button>
            <div className="flex gap-1.5">
              {(['csv', 'xlsx', 'pdf'] as const).map((format) => (
                <Button
                  key={format}
                  variant="outline"
                  size="sm"
                  loading={exporting === format}
                  icon={<DownloadIcon className="h-3.5 w-3.5" />}
                  onClick={() => void handleExport(format)}
                  disabled={exporting !== null || !online}
                  title={online ? undefined : isGuest ? 'Perlu akun untuk export' : 'Perlu koneksi internet'}
                  className="uppercase"
                >
                  {format}
                </Button>
              ))}
            </div>
          </>
        }
      />

      {showForm && (
        <Card className="animate-fade-in p-5">
          {showForm === 'transaction' ? <TransactionForm onDone={() => setShowForm(false)} /> : <TransferForm onDone={() => setShowForm(false)} />}
        </Card>
      )}

      <div className="flex gap-2">
        {(['', 'EXPENSE', 'INCOME'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={clsx(
              'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              typeFilter === t
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800',
            )}
          >
            {t === '' ? 'Semua' : t === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingRows />
        ) : data && data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
                <tr>
                  <th className="px-5 py-3 font-medium">Tanggal</th>
                  <th className="px-5 py-3 font-medium">Akun</th>
                  <th className="px-5 py-3 font-medium">Kategori</th>
                  <th className="px-5 py-3 font-medium">Catatan</th>
                  <th className="px-5 py-3 text-right font-medium">Nominal</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.items.map((tx) => (
                  <tr key={tx.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-400">{formatDate(tx.date)}</td>
                    <td className="px-5 py-3 text-slate-900 dark:text-slate-100">{tx.account?.name}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{tx.category?.name ?? '-'}</td>
                    <td className="max-w-[200px] truncate px-5 py-3 text-slate-600 dark:text-slate-400">{tx.note ?? '-'}</td>
                    <td
                      className={clsx(
                        'whitespace-nowrap px-5 py-3 text-right font-mono',
                        tx.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400',
                      )}
                    >
                      {tx.type === 'EXPENSE' ? '-' : '+'}
                      {formatMoney(tx.amount)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => deleteTransaction.mutate(tx.id)}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                        aria-label="Hapus"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<InboxIcon className="h-6 w-6" />} title="Belum ada transaksi" description="Tambahkan transaksi pertamamu dengan tombol di atas." />
        )}
      </Card>
    </div>
  )
}
