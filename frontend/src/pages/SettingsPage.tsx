import { useState } from 'react'
import clsx from 'clsx'
import { THEMES, useSettingsStore, type Language } from '../lib/settings-store'
import { useT, type TranslationKey } from '../lib/i18n'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { PaletteIcon, GlobeIcon } from '../components/ui/icons'

type Tab = 'theme' | 'language'

const TABS: { id: Tab; labelKey: TranslationKey; icon: typeof PaletteIcon }[] = [
  { id: 'theme', labelKey: 'settings.tabTheme', icon: PaletteIcon },
  { id: 'language', labelKey: 'settings.tabLanguage', icon: GlobeIcon },
]

export default function SettingsPage() {
  const t = useT()
  const [tab, setTab] = useState<Tab>('theme')
  const theme = useSettingsStore((s) => s.theme)
  const language = useSettingsStore((s) => s.language)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const setLanguage = useSettingsStore((s) => s.setLanguage)

  const languages: { id: Language; label: string }[] = [
    { id: 'id', label: t('settings.languageId') },
    { id: 'en', label: t('settings.languageEn') },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.title')} />

      <Card className="overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          {TABS.map((item) => {
            const active = item.id === tab
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-pressed={active}
                className={clsx(
                  'flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors sm:flex-none sm:px-6',
                  active
                    ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300',
                )}
              >
                <item.icon className="h-4 w-4" />
                {t(item.labelKey)}
              </button>
            )
          })}
        </div>

        {tab === 'theme' ? (
          <div className="p-5">
            <p className="text-xs text-slate-500">{t('settings.themeDesc')}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {THEMES.map((meta) => {
                const active = meta.id === theme
                return (
                  <button
                    key={meta.id}
                    type="button"
                    onClick={() => setTheme(meta.id)}
                    aria-pressed={active}
                    className={clsx(
                      'flex flex-col items-stretch overflow-hidden rounded-xl border-2 text-left transition',
                      active
                        ? 'border-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700',
                    )}
                  >
                    <span
                      className="flex h-14 items-center justify-center gap-1 px-2"
                      style={{ backgroundColor: meta.swatch.bg }}
                    >
                      <span
                        className="h-7 w-7 rounded-md border"
                        style={{ backgroundColor: meta.swatch.surface, borderColor: meta.swatch.accent }}
                      />
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: meta.swatch.accent }} />
                    </span>
                    <span className="flex flex-col gap-0.5 bg-white px-2 py-2 dark:bg-slate-900">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {meta.name[language]}
                      </span>
                      <span className="text-[11px] leading-tight text-slate-500">{meta.description[language]}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="p-5">
            <p className="text-xs text-slate-500">{t('settings.languageDesc')}</p>
            <div className="mt-4 flex gap-2">
              {languages.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLanguage(opt.id)}
                  aria-pressed={opt.id === language}
                  className={clsx(
                    'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    opt.id === language
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
