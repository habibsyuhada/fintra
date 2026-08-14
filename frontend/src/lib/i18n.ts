import { useSettingsStore, type Language } from './settings-store'

const dictionaries = {
  id: {
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transaksi',
    'nav.scan': 'Scan Struk',
    'nav.recurring': 'Tagihan',
    'nav.budgets': 'Budget',
    'nav.reports': 'Laporan',
    'nav.accounts': 'Akun',
    'nav.categories': 'Kategori',
    'nav.settings': 'Pengaturan',

    'layout.loading': 'Memuat...',
    'layout.guestBanner': 'Mode Tamu — data hanya tersimpan di perangkat ini.',
    'layout.guestBannerLink': 'Daftar/Masuk',
    'layout.guestBannerSuffix': 'untuk menyinkronkannya ke akun.',
    'layout.synced': 'Tersinkron',
    'layout.syncing': 'Menyinkronkan',
    'layout.offline': 'Offline',
    'layout.pending': 'tertunda',
    'layout.guestMode': 'Mode Tamu',
    'layout.guestName': 'Tamu',
    'layout.logout': 'Keluar',
    'layout.logoutGuest': 'Keluar mode tamu',
    'layout.openMenu': 'Buka menu',
    'layout.closeMenu': 'Tutup menu',

    'auth.loginTitle': 'Masuk ke Fintra',
    'auth.registerTitle': 'Daftar Fintra',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Nama',
    'auth.loginButton': 'Masuk',
    'auth.loginButtonLoading': 'Memproses...',
    'auth.registerButton': 'Daftar',
    'auth.registerButtonLoading': 'Memproses...',
    'auth.noAccount': 'Belum punya akun?',
    'auth.haveAccount': 'Sudah punya akun?',
    'auth.registerLink': 'Daftar',
    'auth.loginLink': 'Masuk',
    'auth.continueAsGuest': 'Lanjutkan tanpa akun →',
    'auth.guestNote': 'Data tersimpan di perangkat ini saja, tidak tersinkron ke cloud.',
    'auth.loginFailed': 'Login gagal',
    'auth.registerFailed': 'Registrasi gagal',

    'settings.title': 'Pengaturan',
    'settings.themeTitle': 'Tema Tampilan',
    'settings.themeDesc': 'Pilih tampilan yang paling cocok untukmu.',
    'settings.languageTitle': 'Bahasa',
    'settings.languageDesc': 'Pilih bahasa yang digunakan di aplikasi.',
    'settings.languageId': 'Indonesia',
    'settings.languageEn': 'Inggris',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transactions',
    'nav.scan': 'Scan Receipt',
    'nav.recurring': 'Bills',
    'nav.budgets': 'Budgets',
    'nav.reports': 'Reports',
    'nav.accounts': 'Accounts',
    'nav.categories': 'Categories',
    'nav.settings': 'Settings',

    'layout.loading': 'Loading...',
    'layout.guestBanner': 'Guest mode — data is only stored on this device.',
    'layout.guestBannerLink': 'Sign up/Sign in',
    'layout.guestBannerSuffix': 'to sync it to an account.',
    'layout.synced': 'Synced',
    'layout.syncing': 'Syncing',
    'layout.offline': 'Offline',
    'layout.pending': 'pending',
    'layout.guestMode': 'Guest Mode',
    'layout.guestName': 'Guest',
    'layout.logout': 'Sign out',
    'layout.logoutGuest': 'Exit guest mode',
    'layout.openMenu': 'Open menu',
    'layout.closeMenu': 'Close menu',

    'auth.loginTitle': 'Sign in to Fintra',
    'auth.registerTitle': 'Create your Fintra account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Name',
    'auth.loginButton': 'Sign in',
    'auth.loginButtonLoading': 'Signing in...',
    'auth.registerButton': 'Sign up',
    'auth.registerButtonLoading': 'Signing up...',
    'auth.noAccount': "Don't have an account?",
    'auth.haveAccount': 'Already have an account?',
    'auth.registerLink': 'Sign up',
    'auth.loginLink': 'Sign in',
    'auth.continueAsGuest': 'Continue without an account →',
    'auth.guestNote': 'Data is stored on this device only and never synced to the cloud.',
    'auth.loginFailed': 'Sign in failed',
    'auth.registerFailed': 'Sign up failed',

    'settings.title': 'Settings',
    'settings.themeTitle': 'App Theme',
    'settings.themeDesc': 'Pick the look that suits you best.',
    'settings.languageTitle': 'Language',
    'settings.languageDesc': 'Choose the language used in the app.',
    'settings.languageId': 'Indonesian',
    'settings.languageEn': 'English',
  },
} as const satisfies Record<Language, Record<string, string>>

export type TranslationKey = keyof (typeof dictionaries)['id']

export function translate(language: Language, key: TranslationKey): string {
  return dictionaries[language][key]
}

/** Reactive translator: re-renders whenever the language setting changes. */
export function useT() {
  const language = useSettingsStore((s) => s.language)
  return (key: TranslationKey) => translate(language, key)
}
