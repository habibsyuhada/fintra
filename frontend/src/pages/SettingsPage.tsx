import clsx from 'clsx'
import { THEMES, useSettingsStore, type Language } from '../lib/settings-store'
import { useT } from '../lib/i18n'

export default function SettingsPage() {
  const t = useT()
  const theme = useSettingsStore((s) => s.theme)
  const language = useSettingsStore((s) => s.language)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const setLanguage = useSettingsStore((s) => s.setLanguage)

  const languages: { id: Language; label: string }[] = [
    { id: 'id', label: t('settings.languageId') },
    { id: 'en', label: t('settings.languageEn') },
  ]

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.title')}</h1>

      <section className="mt-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('settings.themeTitle')}</h2>
        <p className="mt-1 text-xs text-gray-500">{t('settings.themeDesc')}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {THEMES.map((meta) => {
            const active = meta.id === theme
            return (
              <button
                key={meta.id}
                type="button"
                onClick={() => setTheme(meta.id)}
                aria-pressed={active}
                className={clsx(
                  'flex flex-col items-stretch overflow-hidden rounded-lg border-2 text-left transition',
                  active
                    ? 'border-indigo-600'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700',
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
                <span className="flex flex-col gap-0.5 bg-white dark:bg-gray-900 px-2 py-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {meta.name[language]}
                  </span>
                  <span className="text-[11px] leading-tight text-gray-500">{meta.description[language]}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('settings.languageTitle')}</h2>
        <p className="mt-1 text-xs text-gray-500">{t('settings.languageDesc')}</p>

        <div className="mt-4 flex gap-2">
          {languages.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLanguage(opt.id)}
              aria-pressed={opt.id === language}
              className={clsx(
                'rounded-md border px-4 py-2 text-sm font-medium',
                opt.id === language
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
