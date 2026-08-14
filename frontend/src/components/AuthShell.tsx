import type { ReactNode } from 'react'
import { WalletIcon, ChartPieIcon, RepeatIcon, SparklesIcon } from './ui/icons'
import { useT, type TranslationKey } from '../lib/i18n'

const FEATURES: { icon: typeof WalletIcon; textKey: TranslationKey }[] = [
  { icon: WalletIcon, textKey: 'auth.heroFeature1' },
  { icon: ChartPieIcon, textKey: 'auth.heroFeature2' },
  { icon: RepeatIcon, textKey: 'auth.heroFeature3' },
]

export function AuthShell({ children }: { children: ReactNode }) {
  const t = useT()

  return (
    <div className="flex min-h-svh bg-slate-50 dark:bg-slate-950">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-400 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 font-display text-base font-bold backdrop-blur-sm">
            F
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Fintra</span>
        </div>

        <div className="relative">
          <SparklesIcon className="h-8 w-8 text-indigo-200" />
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight">{t('auth.heroHeadline')}</h2>
          <p className="mt-3 max-w-sm text-sm text-indigo-100">{t('auth.heroSubtext')}</p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f.textKey} className="flex items-center gap-3 text-sm text-indigo-50">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <f.icon className="h-4 w-4" />
                </span>
                {t(f.textKey)}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-indigo-200">© {new Date().getFullYear()} Fintra</p>
      </div>

      <div className="flex w-full flex-1 items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-display text-base font-bold text-white shadow-md shadow-indigo-600/25">
              F
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Fintra</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/[0.03] sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
