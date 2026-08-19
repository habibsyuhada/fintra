# Deploy Fintra ke VPS

## 1. Persiapan VPS

- Docker + Docker Compose plugin terpasang.
- Clone repo ke server, mis. `/opt/fintra`.
- Salin `backend/.env.example` ke `.env` di root deploy path (`/opt/fintra/.env` — dibaca oleh `docker-compose.yml` lewat variable substitution `${...}`), isi semua secret (JWT, OPENROUTER_API_KEY, dst).
- Arahkan domain ke IP VPS, siapkan sertifikat SSL (Let's Encrypt/certbot) untuk `deploy/nginx/nginx.conf` — ganti placeholder `DOMAIN` di file tersebut.

## 2. Jalankan stack

```bash
cd /opt/fintra
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
```

Nginx men-serve `frontend/dist` (build sebelumnya lewat CI, lihat `.github/workflows/deploy.yml`) dan proxy `/api/` + `/uploads/` ke backend.

## 3. Backup database

`deploy/backup/backup-db.sh` melakukan `pg_dump` lewat `docker compose exec`, gzip, dan rotasi backup lama. Jadwalkan via cron di VPS:

```cron
0 3 * * * cd /opt/fintra && BACKUP_DIR=/var/backups/fintra RETENTION_DAYS=14 ./deploy/backup/backup-db.sh >> /var/log/fintra-backup.log 2>&1
```

Restore: `./deploy/backup/restore-db.sh /var/backups/fintra/fintra-<timestamp>.sql.gz` (interaktif, minta konfirmasi karena menimpa data).

Sebaiknya salin hasil backup ke penyimpanan terpisah dari VPS (mis. rsync ke storage lain / object storage) — script ini hanya menangani backup lokal + rotasi.

## 4. Artikel harian (AI)

Fitur **Article** menggenerate satu artikel literasi keuangan baru tiap hari lewat `npm run generate-article` di backend (lihat [`backend/README.md`](../backend/README.md#article-literasi-keuangan-harian)). Isi `AI_BASE_URL`/`AI_API_KEY`/`AI_MODEL` di `.env`, lalu jadwalkan via cron di VPS — jalankan di dalam container backend yang sudah punya `DATABASE_URL` dan env AI:

```cron
0 21 * * * cd /opt/fintra && docker compose exec -T backend npm run generate-article >> /var/log/fintra-generate-article.log 2>&1
```

(21:00 UTC = 04:00 WIB.)

## 5. CI/CD otomatis (opsional)

`.github/workflows/deploy.yml` men-deploy otomatis ke VPS saat push ke `main`. Nonaktif secara default sampai dikonfigurasi:

- Repository variable: `DEPLOY_ENABLED = true`
- Repository secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_DEPLOY_PATH`

## 6. Environment terpisah (dev / staging / prod)

- **dev**: `docker-compose.dev.yml` (Postgres + Redis lokal saja) + `npm run start:dev` / `npm run dev`.
- **staging**: instance VPS terpisah (atau port berbeda di VPS yang sama) dengan `.env` sendiri (`NODE_ENV=staging`), database terpisah. Gunakan `docker-compose.yml` yang sama dengan env vars berbeda (`POSTGRES_PORT`, `BACKEND_PORT`, `HTTP_PORT`, dll sudah bisa di-override lewat `.env`).
- **prod**: `docker-compose.yml` seperti di atas dengan `NODE_ENV=production`.

## 7. Monitoring

Set `SENTRY_DSN` di `.env` backend untuk mengaktifkan error tracking (kosongkan untuk menonaktifkan). Log terstruktur JSON (pino) tersedia di stdout container — arahkan ke agregator log pilihan (mis. `docker compose logs`, atau ship ke layanan seperti Loki/Datadog).
