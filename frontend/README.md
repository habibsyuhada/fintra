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
- TanStack Query — data fetching & cache
- React Hook Form + Zod — form & validasi
- Zustand — auth state (access token in-memory, refresh token via httpOnly cookie)
- Tailwind CSS — styling

## Auth

`src/lib/api.ts` menangani access token (in-memory, via Zustand) dan auto-refresh saat 401 menggunakan cookie `refresh_token` (httpOnly, di-set oleh backend). `src/lib/auth-provider.tsx` mencoba refresh session saat app pertama kali dimuat.

## Mobile (Capacitor)

SPA yang sama di-wrap jadi Android/iOS app via Capacitor (`capacitor.config.ts`, appId `com.fintra.app`). Plugin terpasang: `@capacitor/camera`, `@capacitor/local-notifications`, `@capacitor/preferences`, `@capacitor/app`.

```bash
npm run cap:sync      # build web assets + sync ke android/ dan ios/
npm run cap:android   # sync lalu buka di Android Studio
npm run cap:ios       # sync lalu buka di Xcode (perlu macOS)
```

Build Android butuh Android SDK (`ANDROID_HOME`) — tidak tersedia di environment sandbox ini, jadi `android/` sudah di-scaffold dan tervalidasi struktur & plugin-nya, tapi `gradlew assembleDebug` perlu dijalankan di mesin dengan Android SDK atau lewat CI (`.github/workflows/android-build.yml`, sudah menghasilkan APK debug sebagai artifact). Build iOS butuh Xcode di macOS — gunakan `.github/workflows/ios-build.yml` (manual trigger, runner `macos-latest`) atau Mac lokal.

Signing untuk release build (Android keystore, iOS certificate/provisioning profile) belum dikonfigurasi — perlu secrets tambahan di GitHub Actions sebelum publish ke Play Store/TestFlight (lihat komentar di masing-masing workflow file).
