import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAccounts, useCreateAccount, useUpdateAccount } from '../api/accounts'
import type { AccountType } from '../lib/types'

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'BANK', label: 'Bank' },
  { value: 'EWALLET', label: 'E-Wallet' },
  { value: 'CREDIT_CARD', label: 'Kartu Kredit' },
]

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  type: z.enum(['CASH', 'BANK', 'EWALLET', 'CREDIT_CARD']),
  currency: z.string().min(1),
  initialBalance: z.coerce.number().min(0).optional(),
})

type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

function formatMoney(amount: string, currency: string) {
  const value = Number(amount)
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts()
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'CASH', currency: 'IDR' },
  })

  const onSubmit = handleSubmit((values) => {
    createAccount.mutate(values, {
      onSuccess: () => {
        reset()
        setShowForm(false)
      },
    })
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Akun</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {showForm ? 'Batal' : '+ Tambah Akun'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nama</label>
            <input {...register('name')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Tipe</label>
            <select {...register('type')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm">
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Saldo Awal</label>
            <input type="number" step="0.01" {...register('initialBalance')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={createAccount.isPending}
              className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {isLoading ? (
          <p className="p-4 text-sm text-gray-500">Memuat...</p>
        ) : accounts && accounts.length > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Tipe</th>
                <th className="px-4 py-2 text-right">Saldo</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{account.name}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    {ACCOUNT_TYPES.find((t) => t.value === account.type)?.label}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-gray-900 dark:text-gray-100">
                    {formatMoney(account.balance, account.currency)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => updateAccount.mutate({ id: account.id, isArchived: !account.isArchived })}
                      className="text-xs text-gray-500 hover:text-red-600"
                    >
                      {account.isArchived ? 'Aktifkan' : 'Arsipkan'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <p className="p-4 text-sm text-gray-500">Belum ada akun.</p>
        )}
      </div>
    </div>
  )
}
