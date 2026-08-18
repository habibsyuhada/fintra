import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import clsx from 'clsx'
import { FieldWrap, fieldClass } from './Field'

function digitsOnly(value: unknown): string {
  if (value === undefined || value === null) return ''
  return String(value).replace(/\D/g, '')
}

function formatThousands(digits: string): string {
  if (!digits) return ''
  return new Intl.NumberFormat('id-ID').format(Number(digits))
}

/** Nominal input that shows a live thousands separator (e.g. "150.000") while
 * the underlying form value stays a plain digit string, so it drops straight
 * into z.coerce.number() the same way a native number input did. */
export function AmountInput<T extends FieldValues>({
  control,
  name,
  label,
  error,
  wrapClassName,
  className,
  placeholder,
}: {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  error?: string
  wrapClassName?: string
  className?: string
  placeholder?: string
}) {
  const { field } = useController({ control, name })
  const digits = digitsOnly(field.value)

  return (
    <FieldWrap label={label} error={error} className={wrapClassName}>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-slate-400">Rp</span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          value={formatThousands(digits)}
          onChange={(e) => field.onChange(digitsOnly(e.target.value))}
          onBlur={field.onBlur}
          name={field.name}
          ref={field.ref}
          className={clsx(fieldClass, 'pl-9', className)}
        />
      </div>
    </FieldWrap>
  )
}
