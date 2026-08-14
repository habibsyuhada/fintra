import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800', className)}>
      <div>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}
