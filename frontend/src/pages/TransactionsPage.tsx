import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAccounts } from '../api/accounts'
import { useCategories, useCreateCategory } from '../api/categories'
import { useCreateTransaction, useDeleteTransaction, useTransactions, useUpdateTransaction } from '../api/transactions'
import { useCreateTransfer } from '../api/transfers'
import { downloadTransactionsExport, type ExportFormat } from '../api/exports'
import { useOnlineStatus } from '../lib/network-status'
import { useAuthStore } from '../lib/auth-store'
import type { Transaction, TransactionType } from '../lib/types'
import { formatMoney, formatDate } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingRows } from '../components/ui/Spinner'
import { PlusIcon, ArrowsRightLeftIcon, DownloadIcon, PencilIcon, TrashIcon, InboxIcon } from '../components/ui/icons'
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

function TransactionForm({ transaction, onDone }: { transaction?: Transaction; onDone: () => void }) {
  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const createCategory = useCreateCategory()
  const isEditing = Boolean(transaction)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<TxFormValues, unknown, TxFormOutput>({
    resolver: zodResolver(txSchema),
    defaultValues: transaction
      ? {
          accountId: transaction.accountId,
          categoryId: transaction.categoryId ?? '',
          type: transaction.type,
          amount: transaction.amount,
          date: transaction.date.slice(0, 10),
          note: transaction.note ?? '',
        }
      : { type: 'EXPENSE', date: new Date().toISOString().slice(0, 10) },
  })
  const type = watch('type')

  const onSubmit = handleSubmit((values) => {
    const payload = {
      ...values,
      categoryId: values.categoryId || undefined,
      date: new Date(values.date).toISOString(),
    }
    if (transaction) {
      updateTransaction.mutate({ id: transaction.id, ...payload })
      onDone()
    } else {
      createTransaction.mutate(payload, {
        onSuccess: () => {
          setValue('amount', '')
          setValue('note', '')
          setFocus('amount')
        },
      })
    }
  })

  const filteredCategories = categories?.filter((c) => c.type === type) ?? []

  const handleAddCategory = () => {
    const name = newCategoryName.trim()
    if (!name) return
    createCategory.mutate(
      { name, type },
      {
        onSuccess: (id) => {
          setValue('categoryId', id)
          setNewCategoryName('')
          setShowCategoryForm(false)
        },
      },
    )
  }

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
      <div>
        <div className="flex items-center justify-between">
          <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">Kategori</span>
          <button
            type="button"
            onClick={() => setShowCategoryForm((v) => !v)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            {showCategoryForm ? 'Batal' : '+ Kategori baru'}
          </button>
        </div>
        <Select {...register('categoryId')} wrapClassName="mt-0">
          <option value="">Tanpa kategori</option>
          {filteredCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        {showCategoryForm && (
          <div className="mt-2 flex gap-2">
            <input
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCategory()
                }
              }}
              placeholder="Nama kategori baru"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
            />
            <Button type="button" size="sm" onClick={handleAddCategory} loading={createCategory.isPending}>
              Tambah
            </Button>
          </div>
        )}
      </div>
      <Input label="Nominal" type="number" step="0.01" {...register('amount')} error={errors.amount?.message} />
      <Input label="Tanggal" type="date" {...register('date')} />
      <Input label="Catatan" {...register('note')} />
      <div className="sm:col-span-3">
        <Button type="submit" loading={!isEditing && createTransaction.isPending}>
          {isEditing ? 'Simpan Perubahan' : 'Simpan Transaksi'}
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
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('')
  const { data, isLoading } = useTransactions({ type: typeFilter || undefined })
  const deleteTransaction = useDeleteTransaction()
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const isGuest = useAuthStore((s) => s.isGuest)
  const online = useOnlineStatus() && !isGuest

  const closeForm = () => {
    setShowForm(false)
    setEditingTransaction(null)
  }

  const startEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx)
    setShowForm('transaction')
  }

  const openTransactionForm = () => {
    setEditingTransaction(null)
    setShowForm('transaction')
  }

  const openTransferForm = () => {
    setEditingTransaction(null)
    setShowForm('transfer')
  }

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
              onClick={() => (showForm === 'transaction' ? closeForm() : openTransactionForm())}
            >
              {showForm === 'transaction' ? 'Batal' : 'Transaksi'}
            </Button>
            <Button
              variant="outline"
              icon={<ArrowsRightLeftIcon className="h-4 w-4" />}
              onClick={() => (showForm === 'transfer' ? closeForm() : openTransferForm())}
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
          <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {showForm === 'transaction' ? (editingTransaction ? 'Edit Transaksi' : 'Transaksi Baru') : 'Transfer Baru'}
          </p>
          {showForm === 'transaction' ? (
            <TransactionForm key={editingTransaction?.id ?? 'new'} transaction={editingTransaction ?? undefined} onDone={closeForm} />
          ) : (
            <TransferForm onDone={closeForm} />
          )}
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEditTransaction(tx)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                          aria-label="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTransaction.mutate(tx.id)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                          aria-label="Hapus"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
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
