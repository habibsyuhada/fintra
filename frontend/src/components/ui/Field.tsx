import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import clsx from 'clsx'

export const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100'

export function FieldWrap({
  label,
  error,
  className,
  children,
}: {
  label?: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>}
      {children}
      {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  )
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; wrapClassName?: string; rightSlot?: ReactNode }
>(({ label, error, className, wrapClassName, rightSlot, ...props }, ref) => (
  <FieldWrap label={label} error={error} className={wrapClassName}>
    <div className="relative">
      <input ref={ref} className={clsx(fieldClass, rightSlot && 'pr-10', className)} {...props} />
      {rightSlot && <div className="absolute inset-y-0 right-0 flex items-center pr-2">{rightSlot}</div>}
    </div>
  </FieldWrap>
))
Input.displayName = 'Input'

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; wrapClassName?: string }
>(({ label, error, className, wrapClassName, children, ...props }, ref) => (
  <FieldWrap label={label} error={error} className={wrapClassName}>
    <select ref={ref} className={clsx(fieldClass, 'appearance-none bg-[right_0.6rem_center] bg-no-repeat pr-8', className)} style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%2394a3b8' stroke-width='1.75'%3E%3Cpath d='m5 7.5 5 5 5-5'/%3E%3C/svg%3E\")",
    }} {...props}>
      {children}
    </select>
  </FieldWrap>
))
Select.displayName = 'Select'
