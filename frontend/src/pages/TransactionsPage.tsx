import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAccounts } from '../api/accounts'
import { useCategories } from '../api/categories'
import { useCreateTransaction, useDeleteTransaction, useTransactions } from '../api/transactions'
import { useCreateTransfer } from '../api/transfers'
import { downloadTransactionsExport, type ExportFormat } from '../api/exports'
import type { TransactionType } from '../lib/types'

function formatMoney(amount: string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(amount),
  )
}

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
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Tipe</label>
        <select {...register('type')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm">
          <option value="EXPENSE">Pengeluaran</option>
          <option value="INCOME">Pemasukan</option>
        </select>
      </div>
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
          {filteredCategories.map((c) => (
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
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Catatan</label>
        <input {...register('note')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
      </div>
      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={createTransaction.isPending}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Simpan Transaksi
        </button>
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
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Dari Akun</label>
        <select {...register('fromAccountId')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm">
          <option value="">Pilih akun</option>
          {accounts?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {errors.fromAccountId && <p className="mt-1 text-xs text-red-600">{errors.fromAccountId.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Ke Akun</label>
        <select {...register('toAccountId')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm">
          <option value="">Pilih akun</option>
          {accounts?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {errors.toAccountId && <p className="mt-1 text-xs text-red-600">{errors.toAccountId.message}</p>}
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
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Catatan</label>
        <input {...register('note')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
      </div>
      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={createTransfer.isPending}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          Simpan Transfer
        </button>
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

  const handleExport = async (format: ExportFormat) => {
    setExporting(format)
    try {
      await downloadTransactionsExport(format, { type: typeFilter || undefined })
    } finally {
      setExporting(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Transaksi</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(showForm === 'transaction' ? false : 'transaction')}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            {showForm === 'transaction' ? 'Batal' : '+ Transaksi'}
          </button>
          <button
            onClick={() => setShowForm(showForm === 'transfer' ? false : 'transfer')}
            className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {showForm === 'transfer' ? 'Batal' : '+ Transfer'}
          </button>
          <div className="flex gap-1">
            {(['csv', 'xlsx', 'pdf'] as const).map((format) => (
              <button
                key={format}
                onClick={() => void handleExport(format)}
                disabled={exporting !== null}
                className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1.5 text-xs font-medium uppercase text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                {exporting === format ? '...' : format}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          {showForm === 'transaction' ? (
            <TransactionForm onDone={() => setShowForm(false)} />
          ) : (
            <TransferForm onDone={() => setShowForm(false)} />
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {(['', 'EXPENSE', 'INCOME'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              typeFilter === t
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {t === '' ? 'Semua' : t === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {isLoading ? (
          <p className="p-4 text-sm text-gray-500">Memuat...</p>
        ) : data && data.items.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Akun</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2">Catatan</th>
                <th className="px-4 py-2 text-right">Nominal</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((tx) => (
                <tr key={tx.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    {new Date(tx.date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{tx.account?.name}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{tx.category?.name ?? '-'}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{tx.note ?? '-'}</td>
                  <td
                    className={`px-4 py-2 text-right font-mono ${
                      tx.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {tx.type === 'EXPENSE' ? '-' : '+'}
                    {formatMoney(tx.amount)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => deleteTransaction.mutate(tx.id)}
                      className="text-xs text-gray-400 hover:text-red-600"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-4 text-sm text-gray-500">Belum ada transaksi.</p>
        )}
      </div>
    </div>
  )
}
