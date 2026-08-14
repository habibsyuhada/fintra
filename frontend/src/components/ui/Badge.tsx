import type { ReactNode } from 'react'
import clsx from 'clsx'

type Tone = 'slate' | 'green' | 'red' | 'amber' | 'indigo'

const TONE_CLASS: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  red: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
}

export function Badge({ tone = 'slate', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', TONE_CLASS[tone], className)}>
      {children}
    </span>
  )
}
