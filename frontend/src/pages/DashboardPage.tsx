import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAccounts } from '../api/accounts'
import { useTransactions } from '../api/transactions'

function formatMoney(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    amount,
  )
}

export default function DashboardPage() {
  const { data: accounts, isLoading: loadingAccounts } = useAccounts()
  const { data: transactions, isLoading: loadingTx } = useTransactions({ limit: 10 })
  const location = useLocation()
  const migratedCount = (location.state as { migratedCount?: number } | null)?.migratedCount
  const [showMigratedBanner, setShowMigratedBanner] = useState(Boolean(migratedCount))

  const totalBalance = accounts?.reduce((sum, a) => sum + Number(a.balance), 0) ?? 0

  return (
    <div>
      {showMigratedBanner && migratedCount && (
        <div className="mb-4 flex items-center justify-between rounded-md bg-green-50 dark:bg-green-950 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          <span>{migratedCount} data dari mode tamu berhasil digabungkan ke akunmu.</span>
          <button onClick={() => setShowMigratedBanner(false)} className="text-xs underline">
            Tutup
          </button>
        </div>
      )}
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500">Total Saldo</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {loadingAccounts ? '...' : formatMoney(totalBalance)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500">Jumlah Akun</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {loadingAccounts ? '...' : (accounts?.length ?? 0)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <p className="text-xs text-gray-500">Transaksi Terakhir</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {loadingTx ? '...' : (transactions?.total ?? 0)}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <h2 className="border-b border-gray-100 dark:border-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Transaksi Terbaru
        </h2>
        {loadingTx ? (
          <p className="p-4 text-sm text-gray-500">Memuat...</p>
        ) : transactions && transactions.items.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {transactions.items.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{tx.note || tx.category?.name || 'Transaksi'}</p>
                  <p className="text-xs text-gray-500">
                    {tx.account?.name} · {new Date(tx.date).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <span className={`font-mono ${tx.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                  {tx.type === 'EXPENSE' ? '-' : '+'}
                  {formatMoney(Number(tx.amount))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-sm text-gray-500">Belum ada transaksi.</p>
        )}
      </div>
    </div>
  )
}
