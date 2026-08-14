import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Card } from './Card'

const TONE_CLASS = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  red: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'indigo',
  hint,
  loading,
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  tone?: keyof typeof TONE_CLASS
  hint?: ReactNode
  loading?: boolean
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', TONE_CLASS[tone])}>{icon}</div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {loading ? <span className="inline-block h-7 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /> : value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{hint}</p>}
    </Card>
  )
}
