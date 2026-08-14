import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAccounts } from '../api/accounts'
import { useTransactions } from '../api/transactions'
import { formatMoney, formatDate } from '../lib/format'
import { Card, CardHeader } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingRows } from '../components/ui/Spinner'
import { WalletIcon, ChartPieIcon, ReceiptListIcon, CheckCircleIcon, InboxIcon, ArrowUpRightIcon, ArrowDownRightIcon } from '../components/ui/icons'

export default function DashboardPage() {
  const { data: accounts, isLoading: loadingAccounts } = useAccounts()
  const { data: transactions, isLoading: loadingTx } = useTransactions({ limit: 10 })
  const location = useLocation()
  const migratedCount = (location.state as { migratedCount?: number } | null)?.migratedCount
  const [showMigratedBanner, setShowMigratedBanner] = useState(Boolean(migratedCount))

  const totalBalance = accounts?.reduce((sum, a) => sum + Number(a.balance), 0) ?? 0
  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam'

  return (
    <div className="space-y-6">
      {showMigratedBanner && migratedCount && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          <span className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 shrink-0" />
            {migratedCount} data dari mode tamu berhasil digabungkan ke akunmu.
          </span>
          <button onClick={() => setShowMigratedBanner(false)} className="shrink-0 text-xs font-medium underline">
            Tutup
          </button>
        </div>
      )}

      <PageHeader title={`${greeting} 👋`} description="Begini ringkasan keuanganmu hari ini." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Saldo"
          value={formatMoney(totalBalance)}
          icon={<WalletIcon className="h-5 w-5" />}
          tone="indigo"
          loading={loadingAccounts}
        />
        <StatCard
          label="Jumlah Akun"
          value={accounts?.length ?? 0}
          icon={<ChartPieIcon className="h-5 w-5" />}
          tone="green"
          loading={loadingAccounts}
        />
        <StatCard
          label="Total Transaksi"
          value={transactions?.total ?? 0}
          icon={<ReceiptListIcon className="h-5 w-5" />}
          tone="amber"
          loading={loadingTx}
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Transaksi Terbaru" />
        {loadingTx ? (
          <LoadingRows />
        ) : transactions && transactions.items.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.items.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={
                      tx.type === 'EXPENSE'
                        ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950 dark:text-rose-400'
                        : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950 dark:text-emerald-400'
                    }
                  >
                    {tx.type === 'EXPENSE' ? <ArrowDownRightIcon className="h-4 w-4" /> : <ArrowUpRightIcon className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">{tx.note || tx.category?.name || 'Transaksi'}</p>
                    <p className="truncate text-xs text-slate-500">
                      {tx.account?.name} · {formatDate(tx.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 whitespace-nowrap font-mono text-sm font-medium ${
                    tx.type === 'EXPENSE' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {tx.type === 'EXPENSE' ? '-' : '+'}
                  {formatMoney(tx.amount)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<InboxIcon className="h-6 w-6" />} title="Belum ada transaksi" description="Transaksi yang kamu catat akan muncul di sini." />
        )}
      </Card>
    </div>
  )
}
