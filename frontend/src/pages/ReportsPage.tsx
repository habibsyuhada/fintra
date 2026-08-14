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
import { formatMoney } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { ChartPieIcon } from '../components/ui/icons'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const PALETTE = ['#6366f1', '#f97316', '#22c55e', '#eab308', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444']

function ChartLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Spinner />
    </div>
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
      <PageHeader title="Laporan" description="Pantau arus kas dan pola pengeluaranmu dari waktu ke waktu." />

      <Card>
        <CardHeader title={`Cashflow Bulanan (${year})`} />
        <div className="p-5">
          {loadingCashflow ? (
            <ChartLoading />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.5} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.5} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <Tooltip
                    formatter={(v) => formatMoney(Number(v))}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Bar dataKey="Pemasukan" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Breakdown Pengeluaran per Kategori" />
          <div className="p-5">
            {loadingBreakdown ? (
              <ChartLoading />
            ) : breakdown && breakdown.items.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown.items}
                      dataKey="amount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={2}
                      label={((entry: { categoryName?: string; percentage?: number }) =>
                        `${entry.categoryName ?? ''} (${entry.percentage ?? 0}%)`) as never}
                    >
                      {breakdown.items.map((entry, index) => (
                        <Cell key={entry.categoryId ?? index} fill={entry.color ?? PALETTE[index % PALETTE.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={<ChartPieIcon className="h-6 w-6" />} title="Belum ada data" />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Tren Pengeluaran (30 hari terakhir)" />
          <div className="p-5">
            {loadingTrend ? (
              <ChartLoading />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.5} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="currentColor" opacity={0.5} tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
