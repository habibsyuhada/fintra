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

## Mobile

`frontend/` sudah di-wrap Capacitor (`npm run cap:android` / `cap:ios`). Lihat `frontend/README.md`.

## Deploy production

`docker-compose.yml` di root menjalankan Postgres, Redis, backend, dan Nginx (SSL via Let's Encrypt, config di `deploy/nginx/nginx.conf`). Lihat [`deploy/README.md`](./deploy/README.md) untuk panduan lengkap (setup VPS, backup terjadwal, CI/CD, environment dev/staging/prod, monitoring).

## Status implementasi

Fase 1–6 dari `PLAN.md` sudah selesai: fondasi backend, core CRUD, laporan & budget, mobile app, AI scan struk, dan hardening (audit log, rate limiting, structured logging, Sentry, backup, CI/CD). Fase 7 (fitur lanjutan) sedang dikerjakan.
