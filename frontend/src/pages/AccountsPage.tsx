import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAccounts, useCreateAccount, useUpdateAccount } from '../api/accounts'
import type { AccountType } from '../lib/types'
import { formatMoney } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingRows } from '../components/ui/Spinner'
import { PlusIcon, WalletIcon } from '../components/ui/icons'
import clsx from 'clsx'

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
    <div className="space-y-4">
      <PageHeader
        title="Akun"
        description="Kelola dompet, rekening bank, dan sumber dana lainnya."
        actions={
          <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setShowForm((v) => !v)} variant={showForm ? 'secondary' : 'primary'}>
            {showForm ? 'Batal' : 'Tambah Akun'}
          </Button>
        }
      />

      {showForm && (
        <Card className="animate-fade-in p-5">
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Input label="Nama" {...register('name')} error={errors.name?.message} />
            <Select label="Tipe" {...register('type')}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
            <Input label="Saldo Awal" type="number" step="0.01" {...register('initialBalance')} />
            <div className="flex items-end">
              <Button type="submit" loading={createAccount.isPending} className="w-full">
                Simpan
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {isLoading ? (
          <LoadingRows />
        ) : accounts && accounts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60">
                <tr>
                  <th className="px-5 py-3 font-medium">Nama</th>
                  <th className="px-5 py-3 font-medium">Tipe</th>
                  <th className="px-5 py-3 text-right font-medium">Saldo</th>
                  <th className="px-5 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {accounts.map((account) => (
                  <tr key={account.id} className={clsx('transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40', account.isArchived && 'opacity-50')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                          <WalletIcon className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{account.name}</span>
                        {account.isArchived && <Badge tone="slate">Arsip</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{ACCOUNT_TYPES.find((t) => t.value === account.type)?.label}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-slate-900 dark:text-slate-100">
                      {formatMoney(account.balance, account.currency)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => updateAccount.mutate({ id: account.id, isArchived: !account.isArchived })}
                        className="text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
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
          <EmptyState icon={<WalletIcon className="h-6 w-6" />} title="Belum ada akun" description="Tambahkan akun pertamamu untuk mulai mencatat transaksi." />
        )}
      </Card>
    </div>
  )
}
