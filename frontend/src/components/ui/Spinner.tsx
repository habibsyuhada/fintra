import clsx from 'clsx'

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={clsx('animate-spin text-indigo-500', className ?? 'h-5 w-5')} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3.5" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
    </svg>
  )
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" style={{ width: `${85 - i * 12}%` }} />
      ))}
    </div>
  )
}
