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
