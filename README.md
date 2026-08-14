# Fintra

Aplikasi rekap keuangan pribadi — web + mobile (Capacitor), backend NestJS + PostgreSQL. Lihat [`PLAN.md`](./PLAN.md) untuk rancangan lengkap dan roadmap fase.

## Struktur repo

```
backend/    NestJS API (Prisma + PostgreSQL, JWT auth, AI scan struk, audit log)
frontend/   Vite + React SPA (web, di-wrap Capacitor untuk Android/iOS)
deploy/     Nginx, backup database, panduan deploy VPS
```

## Menjalankan secara lokal

```bash
# Database & Redis untuk dev
docker compose -f docker-compose.dev.yml up -d

# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run start:dev

# Frontend (terminal terpisah)
cd frontend
npm install
npm run dev
```

Web app: http://localhost:5173 (proxy `/api` dan `/uploads` ke backend di port 3000).

## Offline

Fitur inti (akun, kategori, transaksi, transfer, budget, tagihan berulang, dashboard, laporan) bisa dipakai **tanpa koneksi internet** — data tersimpan di IndexedDB lokal dan otomatis tersinkron ke backend begitu online kembali. Scan struk (AI), export, dan audit log tetap butuh internet. Detail mekanismenya ada di [`frontend/README.md`](./frontend/README.md#offline-support).

## Mobile

`frontend/` sudah di-wrap Capacitor (`npm run cap:android` / `cap:ios`). Lihat `frontend/README.md`.

## Deploy production

`docker-compose.yml` di root menjalankan Postgres, Redis, backend, dan Nginx (SSL via Let's Encrypt, config di `deploy/nginx/nginx.conf`). Lihat [`deploy/README.md`](./deploy/README.md) untuk panduan lengkap (setup VPS, backup terjadwal, CI/CD, environment dev/staging/prod, monitoring).

## Status implementasi

Seluruh 7 fase di `PLAN.md` sudah selesai:

1. **Fondasi** — backend NestJS + Prisma + PostgreSQL, auth JWT, Docker
2. **Core CRUD** — akun, kategori, transaksi, transfer + frontend web
3. **Laporan & Budget** — cashflow, breakdown kategori, tren, alert budget
4. **Mobile app** — dibungkus Capacitor (Android + iOS)
5. **AI scan struk** — via OpenRouter, draft wajib direview, fallback manual
6. **Hardening** — audit log, rate limiting, structured logging, Sentry, backup, CI/CD
7. **Fitur lanjutan** — recurring transaction (cron), multi-currency snapshot, export CSV/XLSX/PDF, notifikasi lokal (budget & tagihan)

Yang **belum** bisa diverifikasi dari sandbox ini karena butuh kredensial/infra nyata: build APK/IPA sungguhan (perlu Android SDK / Xcode — sudah divalidasi lewat CI), deploy ke VPS asli, dan panggilan AI dengan `OPENROUTER_API_KEY` sungguhan (jalur kode sudah diuji lewat unit test dengan fetch di-mock).

Tambahan di luar roadmap awal `PLAN.md`: **dukungan offline-first** (lihat bagian [Offline](#offline) di atas), ditambahkan atas permintaan setelah fase 1-7 selesai.
