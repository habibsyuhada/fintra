import type { InputHTMLAttributes } from 'react'
import { forwardRef, useState } from 'react'
import { Input } from './Field'
import { EyeIcon, EyeOffIcon } from './icons'

export const PasswordInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; wrapClassName?: string; showLabel?: string; hideLabel?: string }
>(({ showLabel = 'Show password', hideLabel = 'Hide password', ...props }, ref) => {
  const [visible, setVisible] = useState(false)

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      rightSlot={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          className="rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
        >
          {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      }
      {...props}
    />
  )
})
PasswordInput.displayName = 'PasswordInput'
