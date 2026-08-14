import { create } from 'zustand'

export type ThemeId = 'light' | 'dark' | 'dim' | 'flat' | 'cat'
export type Language = 'id' | 'en'

export interface ThemeMeta {
  id: ThemeId
  name: { id: string; en: string }
  description: { id: string; en: string }
  /** Swatch colors used to render the theme preview card. */
  swatch: { bg: string; surface: string; accent: string; text: string }
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'light',
    name: { id: 'Terang', en: 'Light' },
    description: { id: 'Tampilan cerah dan bersih', en: 'Bright and clean look' },
    swatch: { bg: '#f9fafb', surface: '#ffffff', accent: '#4f46e5', text: '#111827' },
  },
  {
    id: 'dark',
    name: { id: 'Gelap', en: 'Dark' },
    description: { id: 'Nyaman di mata saat malam hari', en: 'Easy on the eyes at night' },
    swatch: { bg: '#030712', surface: '#111827', accent: '#6366f1', text: '#f3f4f6' },
  },
  {
    id: 'dim',
    name: { id: 'Redup', en: 'Dim' },
    description: { id: 'Gelap yang lebih lembut dan senyap', en: 'A softer, quieter dark mode' },
    swatch: { bg: '#1c1b22', surface: '#232228', accent: '#8385a8', text: '#d8d6de' },
  },
  {
    id: 'flat',
    name: { id: 'Flat', en: 'Flat' },
    description: { id: 'Desain flat minimalis tanpa bayangan', en: 'Minimal flat design, no shadows' },
    swatch: { bg: '#fafafa', surface: '#ffffff', accent: '#0d9488', text: '#18181b' },
  },
  {
    id: 'cat',
    name: { id: 'Kucing', en: 'Cat' },
    description: { id: 'Tema lucu dengan motif jejak kucing', en: 'A playful theme with cat paw prints' },
    swatch: { bg: '#fff3f9', surface: '#ffffff', accent: '#db2777', text: '#1f1420' },
  },
]

const THEME_KEY = 'fintra-theme'
const LANGUAGE_KEY = 'fintra-language'

function readTheme(): ThemeId {
  const stored = localStorage.getItem(THEME_KEY)
  return THEMES.some((t) => t.id === stored) ? (stored as ThemeId) : 'light'
}

function readLanguage(): Language {
  return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'id'
}

/** Applies the theme to the document root. Exported so index.html's
 * pre-hydration script and this store use the exact same logic. */
export function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme)
}

interface SettingsState {
  theme: ThemeId
  language: Language
  setTheme: (theme: ThemeId) => void
  setLanguage: (language: Language) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: readTheme(),
  language: readLanguage(),
  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme)
    applyTheme(theme)
    set({ theme })
  },
  setLanguage: (language) => {
    localStorage.setItem(LANGUAGE_KEY, language)
    set({ language })
  },
}))
