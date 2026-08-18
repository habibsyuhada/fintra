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
