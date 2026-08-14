import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBudgets, useCreateBudget, useDeleteBudget } from '../api/budgets'
import { useCategories } from '../api/categories'
import { notifyBudgetAlerts } from '../lib/notifications'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    amount,
  )
}

const schema = z.object({
  categoryId: z.string().min(1, 'Pilih kategori'),
  amount: z.coerce.number().positive('Nominal harus lebih dari 0'),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.string().min(1),
})
type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

const PERIOD_LABEL: Record<string, string> = { WEEKLY: 'Mingguan', MONTHLY: 'Bulanan', YEARLY: 'Tahunan' }
const STATUS_STYLE: Record<string, { bar: string; text: string }> = {
  OK: { bar: 'bg-green-500', text: 'text-green-600' },
  NEAR: { bar: 'bg-amber-500', text: 'text-amber-600' },
  OVER: { bar: 'bg-red-500', text: 'text-red-600' },
}

export default function BudgetsPage() {
  const { data: budgets, isLoading } = useBudgets()
  const { data: categories } = useCategories()
  const createBudget = useCreateBudget()
  const deleteBudget = useDeleteBudget()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (budgets) void notifyBudgetAlerts(budgets)
  }, [budgets])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { period: 'MONTHLY', startDate: new Date().toISOString().slice(0, 10) },
  })

  const expenseCategories = categories?.filter((c) => c.type === 'EXPENSE') ?? []

  const onSubmit = handleSubmit((values) => {
    createBudget.mutate(
      { ...values, startDate: new Date(values.startDate).toISOString() },
      { onSuccess: () => { reset(); setShowForm(false) } },
    )
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Budget</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {showForm ? 'Batal' : '+ Tambah Budget'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Kategori</label>
            <select {...register('categoryId')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm">
              <option value="">Pilih kategori</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Nominal</label>
            <input type="number" step="0.01" {...register('amount')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm" />
            {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Periode</label>
            <select {...register('period')} className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm">
              <option value="WEEKLY">Mingguan</option>
              <option value="MONTHLY">Bulanan</option>
              <option value="YEARLY">Tahunan</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={createBudget.isPending}
              className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : budgets && budgets.length > 0 ? (
          budgets.map((budget) => {
            const style = STATUS_STYLE[budget.status]
            return (
              <div key={budget.id} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{budget.category?.name}</p>
                    <p className="text-xs text-gray-500">{PERIOD_LABEL[budget.period]}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${style.text}`}>{budget.percentage}%</p>
                    <button
                      onClick={() => deleteBudget.mutate(budget.id)}
                      className="text-xs text-gray-400 hover:text-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-full ${style.bar}`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formatMoney(budget.spent)} dari {formatMoney(Number(budget.amount))}
                  {budget.status === 'OVER' && ' — melebihi limit!'}
                  {budget.status === 'NEAR' && ' — mendekati limit'}
                </p>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-gray-500">Belum ada budget.</p>
        )}
      </div>
    </div>
  )
}
