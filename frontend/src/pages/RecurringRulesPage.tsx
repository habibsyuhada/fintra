import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAccounts } from '../api/accounts'
import { useCategories } from '../api/categories'
import {
  useCreateRecurringRule,
  useDeleteRecurringRule,
  useRecurringRules,
  useUpdateRecurringRule,
} from '../api/recurring-rules'
import { notifyUpcomingBills } from '../lib/notifications'

function formatMoney(amount: string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(amount),
  )
}

const FREQUENCY_LABEL: Record<string, string> = {
  DAILY: 'Harian',
  WEEKLY: 'Mingguan',
  MONTHLY: 'Bulanan',
  YEARLY: 'Tahunan',
}

const schema = z.object({
  accountId: z.string().min(1, 'Pilih akun'),
  categoryId: z.string().optional(),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().positive('Nominal harus lebih dari 0'),
  note: z.string().optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  nextRunDate: z.string().min(1),
})
type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

export default function RecurringRulesPage() {
  const { data: rules, isLoading } = useRecurringRules()
  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories()
  const createRule = useCreateRecurringRule()
  const updateRule = useUpdateRecurringRule()
  const deleteRule = useDeleteRecurringRule()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (rules) void notifyUpcomingBills(rules)
  }, [rules])

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'EXPENSE', frequency: 'MONTHLY', nextRunDate: new Date().toISOString().slice(0, 10) },
  })
  const type = watch('type')
  const filteredCategories = categories?.filter((c) => c.type === type) ?? []

  const onSubmit = handleSubmit((values) => {
    createRule.mutate(
      { ...values, categoryId: values.categoryId || undefined, nextRunDate: new Date(values.nextRunDate).toISOString() },
      { onSuccess: () => { reset(); setShowForm(false) } },
    )
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tagihan &amp; Langganan Berulang</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {showForm ? 'Batal' : '+ Tambah Tagihan'}
        </button>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Transaksi akan otomatis tercatat setiap periode berjalan (dijalankan oleh backend setiap jam).
      </p>

      {showForm && (
        <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:grid-cols-3">
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
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Frekuensi</label>
            <select {...register('frequency')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm">
              {Object.entries(FREQUENCY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Mulai / Jatuh Tempo Berikutnya</label>
            <input type="date" {...register('nextRunDate')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Catatan</label>
            <input {...register('note')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
          </div>
          <div className="flex items-end sm:col-span-3">
            <button
              type="submit"
              disabled={createRule.isPending}
              className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {isLoading ? (
          <p className="p-4 text-sm text-gray-500">Memuat...</p>
        ) : rules && rules.length > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Nama/Catatan</th>
                <th className="px-4 py-2">Akun</th>
                <th className="px-4 py-2">Frekuensi</th>
                <th className="px-4 py-2">Jatuh Tempo Berikutnya</th>
                <th className="px-4 py-2 text-right">Nominal</th>
                <th className="px-4 py-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                    {rule.note || rule.category?.name || 'Tagihan'}
                  </td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{rule.account?.name}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{FREQUENCY_LABEL[rule.frequency]}</td>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    {new Date(rule.nextRunDate).toLocaleDateString('id-ID')}
                  </td>
                  <td className={`px-4 py-2 text-right font-mono ${rule.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                    {formatMoney(rule.amount)}
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => updateRule.mutate({ id: rule.id, isActive: !rule.isActive })}
                      className="text-xs text-gray-500 hover:text-indigo-600"
                    >
                      {rule.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => deleteRule.mutate(rule.id)}
                      className="text-xs text-gray-400 hover:text-red-600"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <p className="p-4 text-sm text-gray-500">Belum ada tagihan berulang.</p>
        )}
      </div>
    </div>
  )
}
