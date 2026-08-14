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
