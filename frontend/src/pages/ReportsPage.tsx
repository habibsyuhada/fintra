import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useCashflowReport, useCategoryBreakdownReport, useTrendReport } from '../api/reports'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const PALETTE = ['#6366f1', '#f97316', '#22c55e', '#eab308', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444']

function formatMoney(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    amount,
  )
}

export default function ReportsPage() {
  const [year] = useState(new Date().getFullYear())
  const { data: cashflow, isLoading: loadingCashflow } = useCashflowReport(year)
  const { data: breakdown, isLoading: loadingBreakdown } = useCategoryBreakdownReport('EXPENSE')
  const { data: trend, isLoading: loadingTrend } = useTrendReport('day')

  const cashflowData = cashflow?.months.map((m) => ({ name: MONTH_LABELS[m.month - 1], Pemasukan: m.income, Pengeluaran: m.expense }))
  const trendData = trend?.items.map((i) => ({
    name: new Date(i.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    total: i.total,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Laporan</h1>

      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cashflow Bulanan ({year})</h2>
        {loadingCashflow ? (
          <p className="mt-4 text-sm text-gray-500">Memuat...</p>
        ) : (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => formatMoney(Number(v))} />
                <Legend />
                <Bar dataKey="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Breakdown Pengeluaran per Kategori</h2>
          {loadingBreakdown ? (
            <p className="mt-4 text-sm text-gray-500">Memuat...</p>
          ) : breakdown && breakdown.items.length > 0 ? (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown.items}
                    dataKey="amount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={((entry: { categoryName?: string; percentage?: number }) =>
                      `${entry.categoryName ?? ''} (${entry.percentage ?? 0}%)`) as never}
                  >
                    {breakdown.items.map((entry, index) => (
                      <Cell key={entry.categoryId ?? index} fill={entry.color ?? PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Belum ada data.</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tren Pengeluaran (30 hari terakhir)</h2>
          {loadingTrend ? (
            <p className="mt-4 text-sm text-gray-500">Memuat...</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
