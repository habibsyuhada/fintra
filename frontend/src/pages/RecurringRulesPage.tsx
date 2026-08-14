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
import { formatMoney, formatDate } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingRows } from '../components/ui/Spinner'
import { PlusIcon, RepeatIcon, TrashIcon } from '../components/ui/icons'
import clsx from 'clsx'

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
    <div className="space-y-4">
      <PageHeader
        title="Tagihan & Langganan Berulang"
        description="Transaksi akan otomatis tercatat setiap periode berjalan (dijalankan oleh backend setiap jam)."
        actions={
          <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setShowForm((v) => !v)} variant={showForm ? 'secondary' : 'primary'}>
            {showForm ? 'Batal' : 'Tambah Tagihan'}
          </Button>
        }
      />

      {showForm && (
        <Card className="animate-fade-in p-5">
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
            <Select label="Frekuensi" {...register('frequency')}>
              {Object.entries(FREQUENCY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input label="Mulai / Jatuh Tempo Berikutnya" type="date" {...register('nextRunDate')} />
            <Input label="Catatan" {...register('note')} wrapClassName="sm:col-span-3" />
            <div className="sm:col-span-3">
              <Button type="submit" loading={createRule.isPending}>
                Simpan
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingRows />
        ) : rules && rules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
                <tr>
                  <th className="px-5 py-3 font-medium">Nama/Catatan</th>
                  <th className="px-5 py-3 font-medium">Akun</th>
                  <th className="px-5 py-3 font-medium">Frekuensi</th>
                  <th className="px-5 py-3 font-medium">Jatuh Tempo Berikutnya</th>
                  <th className="px-5 py-3 text-right font-medium">Nominal</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rules.map((rule) => (
                  <tr key={rule.id} className={clsx('transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40', !rule.isActive && 'opacity-50')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                          <RepeatIcon className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{rule.note || rule.category?.name || 'Tagihan'}</span>
                        {!rule.isActive && <Badge tone="slate">Nonaktif</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{rule.account?.name}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{FREQUENCY_LABEL[rule.frequency]}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600 dark:text-slate-400">{formatDate(rule.nextRunDate)}</td>
                    <td className={clsx('whitespace-nowrap px-5 py-3 text-right font-mono', rule.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
                      {formatMoney(rule.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => updateRule.mutate({ id: rule.id, isActive: !rule.isActive })}
                          className="whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
                        >
                          {rule.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() => deleteRule.mutate(rule.id)}
                          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                          aria-label="Hapus"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={<RepeatIcon className="h-6 w-6" />} title="Belum ada tagihan berulang" description="Tambahkan tagihan rutin agar tidak lupa mencatatnya." />
        )}
      </Card>
    </div>
  )
}
