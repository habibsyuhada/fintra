# Fintra Backend

NestJS API for the Fintra personal finance app. PostgreSQL via Prisma (driver adapter `@prisma/adapter-pg`), JWT access + rotating refresh token auth.

## Development

```bash
npm install
cp .env.example .env      # fill in secrets, point DATABASE_URL at your Postgres
npx prisma migrate dev    # apply schema
npm run start:dev
```

API is served under `/api` (e.g. `GET /api/health`).

## Scripts

- `npm run start:dev` — watch mode
- `npm run build` — compile to `dist/`
- `npm run lint` — ESLint (+ Prettier)
- `npm test` / `npm run test:e2e` — unit / e2e tests (require a reachable Postgres via `DATABASE_URL`)

## Auth flow

- `POST /api/auth/register`, `POST /api/auth/login` — returns `{ user, accessToken }`, sets an httpOnly `refresh_token` cookie scoped to `/api/auth`.
- `POST /api/auth/refresh` — rotates the refresh token (old one is revoked), returns a new access token.
- `POST /api/auth/logout` — revokes the current refresh token.
- `GET /api/auth/me` — requires `Authorization: Bearer <accessToken>`.

## Database schema

See `prisma/schema.prisma`. Generated client lives in `src/generated/prisma` (gitignored, run `npx prisma generate`).

## Scan struk (AI)

- `POST /api/receipts/scan` — multipart upload (`file`), sends the image to a vision model server-side (`OPENROUTER_BASE_URL`/`OPENROUTER_API_KEY`/`OPENROUTER_MODEL` in `.env`) and returns a `draft` (merchant/date/total/items/category_guess) for the user to review. `OPENROUTER_BASE_URL` is the OpenAI-compatible base URL to call — point it at your 9router proxy, or leave it empty to call OpenRouter directly. The photo is always saved as a `Receipt` (status `PENDING`) even if `OPENROUTER_API_KEY` is unset or the AI call fails — the response includes an `error` message and the frontend falls back to manual entry.
- `POST /api/receipts/:id/confirm` — turns a reviewed draft into a real `Transaction` (same validation as `POST /transactions`) and links it back to the receipt (`status` becomes `CONFIRMED`).
- `POST /api/receipts/:id/reject` — discards the draft (`status` becomes `REJECTED`) without creating a transaction.
- Images are stored on local disk under `uploads/receipts/` and served statically at `/uploads/receipts/...` (outside the `/api` prefix). Swap this for S3/object storage before running multiple backend replicas in production.

## Article (literasi keuangan harian)

Artikel harian bertema "dari mana duit datang / cara duit bekerja", digenerate otomatis oleh AI dan dibaca lewat web/mobile.

- Skema: `articles` (`title`, `slug` unik, `body_md`, `topic_id`, `status` `UNREAD`/`READ`/`FAVORIT`, `is_public`, `sources` JSON array `{title,url}[]`, `created_at`) dan `topic_queue` (`topic`, `context`, `used_at` — `NULL` berarti belum dipakai). `prisma/migrations/20260819031721_seed_topic_queue` mengisi 30 topik awal.
- `GET /api/articles?status=&page=&limit=` — daftar artikel, terbaru dulu, filter opsional by status.
- `GET /api/articles/:idOrSlug` — detail (terima id atau slug).
- `PATCH /api/articles/:idOrSlug` — `{ status?, isPublic? }`. `status` cuma satu nilai aktif (bukan flag terpisah) — favoritkan artikel akan mengganti status `READ`/`UNREAD` sebelumnya jadi `FAVORIT`.
- `POST /api/topics` — `{ topic, context? }`, menambah ide topik baru ke antrean (opsional — sekadar inspirasi tambahan, generator tidak wajib memakainya).
- **Generator**: bukan script cron biasa, tapi **Routine** (scheduled trigger) Claude Code yang jalan tiap pagi 04:00 WIB. Firing-nya membangunkan sesi Claude yang benar-benar riset internet (web search) untuk konten literasi keuangan yang lagi viral/trending di Indonesia (tema "dari mana duit datang / cara duit bekerja"), menulis artikelnya (600-900 kata, struktur pembuka/penjelasan/analogi/perhitungan Rupiah/insight, plus 2-4 sumber referensi nyata), lalu mengirim hasilnya ke:
  - `POST /api/articles/internal` — `{ title, bodyMd, sources?: { title, url }[] }`, diautentikasi pakai header `X-Internal-Key: <INTERNAL_API_KEY>` (bukan JWT user, karena tidak ada manusia yang login saat Routine jalan). Idempotent: menolak dengan `409` kalau sudah ada artikel yang dibuat hari ini (WIB). Endpoint ini selalu menolak request kalau `INTERNAL_API_KEY` belum diisi di `.env` (fail closed).
  - `sources` ditampilkan di halaman baca sebagai kartu "Sumber & Referensi" (judul + domain + link ke sumber asli) — bukan embed script pihak ketiga, supaya tidak menambah dependency ke widget eksternal (Twitter/IG/TikTok embed.js) di aplikasi finansial.
- Isi `INTERNAL_API_KEY` (string acak panjang) di `.env` sebelum mengaktifkan Routine-nya.
- Test manual: pastikan `AI_BASE_URL`/`AI_API_KEY`/`AI_MODEL` terisi di `.env`, lalu `npm run generate-article`. Untuk test tanpa memanggil API asli, arahkan `AI_BASE_URL` ke server lokal yang membalas format `chat/completions` OpenAI-compatible.

## Production hardening

- **Audit log**: every create/update/delete on accounts, categories, transactions, transfers, budgets and receipts is recorded in `audit_logs` (`userId`, `entity`, `entityId`, `action`, `changes`, `createdAt`). Read via `GET /api/audit-logs?entity=&entityId=`. Failures to write an audit entry are logged but never fail the underlying request.
- **Soft-delete**: transactions are never hard-deleted (`isDeleted`/`deletedAt`), preserving history for audit/reporting even after "deletion".
- **Rate limiting**: global `ThrottlerModule` (100 req/min/IP by default), tighter limits on `/auth/register` (5/min), `/auth/login` (10/min) and `/receipts/scan` (10/min, since it costs an AI call).
- **Validation**: global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted` — unknown/extra fields in request bodies are rejected outright.
- **Structured logging**: `nestjs-pino` — JSON logs in production, pretty-printed in dev, silent in tests. `Authorization`/`Cookie`/`Set-Cookie` headers are redacted.
- **Error tracking**: set `SENTRY_DSN` to report unhandled exceptions and 5xx `HttpException`s to Sentry (`src/common/filters/sentry-exception.filter.ts`); leave it empty to disable — nothing is sent anywhere in that case.
- **Backups**: see `deploy/backup/backup-db.sh` / `deploy/README.md` for a cron-driven `pg_dump` + rotation setup.
- **Sensitive data**: accounts store only a name/type/currency/balance — no raw card or bank account numbers are captured anywhere in the schema, so there's nothing that needs field-level encryption today. Revisit if that changes.
- **CI/CD**: `.github/workflows/backend-ci.yml` runs lint, migrations, build, unit + e2e tests on every push/PR. `.github/workflows/deploy.yml` deploys to a VPS over SSH (disabled until `DEPLOY_ENABLED`/secrets are configured — see `deploy/README.md`).

## Fitur lanjutan

- **Recurring transactions**: `POST/GET/PATCH/DELETE /api/recurring-rules` manage rules (account, category, amount, frequency, `nextRunDate`). An hourly cron (`@nestjs/schedule`, `RecurringRulesCron`) finds every active rule whose `nextRunDate` has passed, creates the corresponding `Transaction` (`isRecurringInstance: true`), and advances `nextRunDate` — catching up multiple missed periods (capped at 60) if the server was down. Covered by `test/recurring-rules.e2e-spec.ts`.
- **Multi-currency**: `POST /api/transactions` accepts optional `originalAmount`/`originalCurrency`/`exchangeRate`. `amount` always stays in the account's own currency (balance math is unaffected); the original fields are stored purely as an audit/display snapshot of what was actually paid.
- **Export**: `GET /api/exports/transactions?format=csv|xlsx|pdf` (same filters as `GET /transactions`) streams a CSV, XLSX (`exceljs`) or PDF (`pdfkit`) file.
- **Push notifications**: not a backend concern — the frontend schedules local notifications (Capacitor `@capacitor/local-notifications`, native platforms only) when a budget crosses 80%/100% or a recurring bill is due within 3 days, using data already exposed by the endpoints above.
