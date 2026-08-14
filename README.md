# Fintra

Aplikasi rekap keuangan pribadi — web + mobile (Capacitor), backend NestJS + PostgreSQL. Lihat [`PLAN.md`](./PLAN.md) untuk rancangan lengkap dan roadmap fase.

## Struktur repo

```
backend/    NestJS API (Prisma + PostgreSQL, JWT auth)
frontend/   Vite + React SPA (web, di-wrap Capacitor untuk mobile)
deploy/     Konfigurasi Nginx untuk VPS
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
```

Frontend akan ditambahkan pada Fase 2.

## Deploy production

`docker-compose.yml` di root menjalankan Postgres, Redis, backend, dan Nginx (SSL via Let's Encrypt, config di `deploy/nginx/nginx.conf`). Isi `.env` di VPS sesuai `backend/.env.example` sebelum `docker compose up -d`.
