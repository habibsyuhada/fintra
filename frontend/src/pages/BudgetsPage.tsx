import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBudgets, useCreateBudget, useDeleteBudget } from '../api/budgets'
import { useCategories } from '../api/categories'
import { notifyBudgetAlerts } from '../lib/notifications'
import { formatMoney } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Field'
import { AmountInput } from '../components/ui/AmountInput'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PlusIcon, PiggyIcon, TrashIcon, AlertTriangleIcon } from '../components/ui/icons'
import clsx from 'clsx'

const schema = z.object({
  categoryId: z.string().min(1, 'Pilih kategori'),
  amount: z.coerce.number().positive('Nominal harus lebih dari 0'),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.string().min(1),
})
type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>

const PERIOD_LABEL: Record<string, string> = { WEEKLY: 'Mingguan', MONTHLY: 'Bulanan', YEARLY: 'Tahunan' }
const STATUS_STYLE: Record<string, { bar: string; badge: 'green' | 'amber' | 'red' }> = {
  OK: { bar: 'bg-emerald-500', badge: 'green' },
  NEAR: { bar: 'bg-amber-500', badge: 'amber' },
  OVER: { bar: 'bg-rose-500', badge: 'red' },
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
    control,
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
    <div className="space-y-4">
      <PageHeader
        title="Budget"
        description="Atur batas pengeluaran per kategori dan pantau progresnya."
        actions={
          <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setShowForm((v) => !v)} variant={showForm ? 'secondary' : 'primary'}>
            {showForm ? 'Batal' : 'Tambah Budget'}
          </Button>
        }
      />

      {showForm && (
        <Card className="animate-fade-in p-5">
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Select label="Kategori" {...register('categoryId')} error={errors.categoryId?.message}>
              <option value="">Pilih kategori</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <AmountInput label="Nominal" control={control} name="amount" error={errors.amount?.message} />
            <Select label="Periode" {...register('period')}>
              <option value="WEEKLY">Mingguan</option>
              <option value="MONTHLY">Bulanan</option>
              <option value="YEARLY">Tahunan</option>
            </Select>
            <div className="flex items-end">
              <Button type="submit" loading={createBudget.isPending} className="w-full">
                Simpan
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i} className="h-32 animate-pulse p-5" />
          ))}
        </div>
      ) : budgets && budgets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {budgets.map((budget) => {
            const style = STATUS_STYLE[budget.status]
            return (
              <Card key={budget.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{budget.category?.name}</p>
                    <p className="text-xs text-slate-500">{PERIOD_LABEL[budget.period]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={style.badge}>{budget.percentage}%</Badge>
                    <button
                      onClick={() => deleteBudget.mutate(budget.id)}
                      className="rounded-md p-1 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                      aria-label="Hapus"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={clsx('h-full rounded-full transition-all', style.bar)} style={{ width: `${Math.min(budget.percentage, 100)}%` }} />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  {budget.status !== 'OK' && <AlertTriangleIcon className={clsx('h-3.5 w-3.5', budget.status === 'OVER' ? 'text-rose-500' : 'text-amber-500')} />}
                  {formatMoney(budget.spent)} dari {formatMoney(Number(budget.amount))}
                  {budget.status === 'OVER' && ' — melebihi limit!'}
                  {budget.status === 'NEAR' && ' — mendekati limit'}
                </p>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <EmptyState icon={<PiggyIcon className="h-6 w-6" />} title="Belum ada budget" description="Buat batas pengeluaran per kategori agar keuanganmu tetap terkendali." />
        </Card>
      )}
    </div>
  )
}
