# Fintra Frontend

Vite + React SPA untuk Fintra. Di-deploy sebagai static build (dan di-wrap Capacitor untuk mobile pada Fase 4).

## Development

```bash
npm install
npm run dev
```

Dev server proxy `/api` ke `http://localhost:3000` (lihat `vite.config.ts`) — jalankan backend secara terpisah.

## Stack

- React Router — routing
- Dexie (IndexedDB) — penyimpanan lokal & offline-first data layer untuk akun/kategori/transaksi/transfer/budget/tagihan berulang
- TanStack Query — dipakai untuk fitur yang memang online-only (auth, scan struk, export)
- React Hook Form + Zod — form & validasi
- Zustand — auth & network state
- Tailwind CSS — styling
- `vite-plugin-pwa` — service worker (precache app shell) supaya web app bisa dibuka/di-reload tanpa internet

## Auth

`src/lib/api.ts` menangani access token (in-memory, via Zustand) dan auto-refresh saat 401 menggunakan cookie `refresh_token` (httpOnly, di-set oleh backend). `src/lib/auth-provider.tsx` mencoba refresh session saat app pertama kali dimuat. Kalau refresh gagal karena **jaringan** (bukan sesi yang benar-benar invalid), profil user terakhir yang di-cache di `localStorage` dipakai untuk tetap membuka app shell dalam mode offline — lihat bagian di bawah.

## Offline support

Aplikasi ini **offline-first** untuk fitur inti (akun, kategori, transaksi, transfer, budget, tagihan berulang, dashboard, laporan): semua data disimpan di IndexedDB lokal (`src/lib/db.ts`, satu database per user) dan dibaca langsung dari sana (`dexie-react-hooks`), bukan dari network setiap kali. Baca lebih detail cara kerjanya:

- **Baca**: setiap hook di `src/api/*.ts` (`useAccounts`, `useTransactions`, dst) query ke IndexedDB, bukan ke API — jadi selalu tersedia meski tanpa koneksi, termasuk setelah reload total (service worker meng-cache app shell-nya).
- **Tulis**: create/update/delete langsung menulis ke IndexedDB (UI ter-update seketika/optimistic) dan menambah entri ke `syncQueue`. Record baru dapat id sementara (`local-<uuid>`).
- **Sinkronisasi**: `src/lib/sync-engine.ts` mem-push antrean ke API begitu online (saat reconnect, saat app dibuka, atau tiap 30 detik dicek), lalu me-remap id sementara ke id asli dari server (termasuk merapikan referensi silang seperti `accountId` di transaksi lain yang masih tertunda), baru menarik ulang data terbaru dari server. Kalkulasi saldo & status budget di-porting persis dari logika backend (`src/lib/offline-calc.ts`) supaya angkanya konsisten baik online maupun offline.
- **Yang tetap butuh internet**: Scan Struk (panggil AI di backend), Export CSV/XLSX/PDF, dan Audit Log — halaman-halaman ini menampilkan status/pesan jelas saat offline (lihat `useOnlineStatus()` dari `src/lib/network-status.ts`) daripada gagal diam-diam.
- Indikator status sinkronisasi (online/offline + jumlah perubahan tertunda) tampil di header (`src/components/Layout.tsx`).

Sudah diuji lewat Playwright dengan koneksi benar-benar diputus (`context.setOffline(true)`): membuat akun/kategori/transaksi saat offline, reload penuh saat offline (app shell + data tetap tampil, tidak ter-redirect ke login), lalu reconnect dan verifikasi data tersinkron ke database server dengan id asli.

## Mobile (Capacitor)

SPA yang sama di-wrap jadi Android/iOS app via Capacitor (`capacitor.config.ts`, appId `com.fintra.app`). Plugin terpasang: `@capacitor/camera`, `@capacitor/local-notifications`, `@capacitor/preferences`, `@capacitor/app`.

```bash
npm run cap:sync      # build web assets + sync ke android/ dan ios/
npm run cap:android   # sync lalu buka di Android Studio
npm run cap:ios       # sync lalu buka di Xcode (perlu macOS)
```

Build Android butuh Android SDK (`ANDROID_HOME`) — tidak tersedia di environment sandbox ini, jadi `android/` sudah di-scaffold dan tervalidasi struktur & plugin-nya, tapi `gradlew assembleDebug` perlu dijalankan di mesin dengan Android SDK atau lewat CI (`.github/workflows/android-build.yml`, sudah menghasilkan APK debug sebagai artifact). Build iOS butuh Xcode di macOS — gunakan `.github/workflows/ios-build.yml` (manual trigger, runner `macos-latest`) atau Mac lokal.

Signing untuk release build (Android keystore, iOS certificate/provisioning profile) belum dikonfigurasi — perlu secrets tambahan di GitHub Actions sebelum publish ke Play Store/TestFlight (lihat komentar di masing-masing workflow file).
