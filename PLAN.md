# Personal Finance App — Project Plan

> Aplikasi rekap keuangan pribadi, production-ready, web + mobile (via Capacitor), deploy ke VPS dengan PostgreSQL.
> Implementasi menggunakan Claude Sonnet 5 (high effort).

---

## 1. Ringkasan Proyek

Aplikasi untuk mencatat dan mengelola keuangan pribadi secara lengkap: transaksi, akun/wallet, kategori, budget, recurring transaction, laporan, dan fitur scan struk otomatis berbasis AI. Bisa diakses via web browser maupun mobile app (Android/iOS) dari satu codebase yang sama.

---

## 2. Arsitektur

```
┌─────────────────────────────┐
│   React SPA (Vite)          │
│   ├─ Web: deploy static     │───→ Nginx (VPS) + SSL (Let's Encrypt)
│   └─ Mobile: Capacitor wrap │───→ Android/iOS build via GitHub Actions
└──────────────┬───────────────┘
               │ REST API (JSON)
               ▼
      Backend API (NestJS/FastAPI)
               │
      ┌────────┼─────────────┐
      ▼        ▼             ▼
 PostgreSQL   Redis      9router → OpenRouter
  (VPS)     (cache/queue)  (vision model, scan struk)
```

**Prinsip utama:** satu backend API menjadi single source of truth untuk semua business logic (kalkulasi saldo, budget, recurring transaction) — web dan mobile hanya konsumen API yang sama, sehingga perilaku konsisten di semua platform.

---

## 3. Tech Stack

| Layer | Pilihan | Catatan |
|---|---|---|
| Backend | NestJS (TypeScript) atau FastAPI (Python) | Pilih salah satu — struktural, banyak library auth/validation siap pakai |
| Database | PostgreSQL | Sudah tersedia di VPS |
| ORM | Prisma (Nest) / SQLAlchemy (FastAPI) | Migration terkelola, type-safe |
| Frontend web+mobile | **Vite + React (full SPA)** | Bukan Next.js SSR — supaya kompatibel langsung dengan Capacitor |
| Mobile wrapper | **Capacitor** | Wrap SPA yang sama jadi APK/IPA, build via GitHub Actions |
| Auth | JWT + refresh token | Auth aman untuk data finansial |
| Cache/Queue | Redis | Session, rate limiting, job recurring transaction |
| Reverse proxy | Nginx / Caddy | Di VPS, handle SSL |
| Container | Docker + docker-compose | Deployment konsisten, mudah rollback |
| AI (scan struk) | 9router → OpenRouter (vision model) | Dipanggil dari backend, bukan langsung dari client |

### Kenapa Vite SPA, bukan Next.js
Capacitor butuh static build murni. Next.js dengan SSR/server components tidak bisa langsung di-wrap. Karena app finansial mayoritas dipakai di balik login (SEO tidak krusial), Vite + React SPA lebih ringan dan lebih kompatibel dengan Capacitor.

### Plugin Capacitor yang dibutuhkan
- `@capacitor/camera` — foto struk
- `@capacitor/local-notifications` — reminder budget/tagihan
- `@capacitor/preferences` — local cache ringan
- `@capacitor/app` — handle lifecycle

---

## 4. Fitur

### 4.1 Fitur Inti (MVP)
- **Auth**: register/login, email verification, reset password, opsional OAuth Google
- **Akun/Wallet**: multiple akun (cash, bank, e-wallet, kartu kredit) dengan saldo masing-masing
- **Transaksi**: income / expense / transfer antar akun, kategori & sub-kategori, tag, attachment struk
- **Kategori custom**: user buat kategori sendiri + icon/warna
- **Budget**: set budget per kategori per periode, notifikasi mendekati/lewat limit
- **Recurring transaction**: tagihan/langganan otomatis tercatat tiap periode
- **Laporan & grafik**: cashflow bulanan, breakdown per kategori, tren pengeluaran
- **Multi-currency** (opsional): exchange rate snapshot per transaksi
- **Export**: CSV / Excel / PDF
- **Multi-device sync**: konsisten antara web dan mobile

### 4.2 Fitur AI — Scan Struk ke Data Keuangan
Alur:
1. User foto struk lewat Capacitor Camera, gambar dikompres di client sebelum upload.
2. Backend menerima gambar, mengirimkannya ke model vision lewat 9router → OpenRouter.
3. Model mengembalikan JSON terstruktur: `merchant`, `date`, `total`, `items[]`, `category_guess`.
4. Hasil ditampilkan sebagai **draft transaksi** yang wajib direview/diedit user sebelum disimpan — tidak pernah auto-save langsung.
5. Jika parsing gagal, fallback ke input manual.

Prinsip desain fitur ini:
- API key 9router/OpenRouter hanya disimpan di backend, tidak pernah di client (mencegah abuse jika mobile app di-decompile).
- Simpan `raw_ai_response` (JSONB) untuk keperluan debug/evaluasi prompt di masa depan.
- Simpan foto struk asli sebagai attachment untuk audit.

### 4.3 Aspek Production-Ready
- Audit log (siapa mengubah apa, kapan)
- Soft-delete untuk transaksi (tidak hard delete)
- Rate limiting & validasi input ketat di API
- Backup otomatis database (terjadwal, mengikuti pola backup yang sudah pernah dipakai untuk Docmost)
- Monitoring & error tracking (mis. Sentry) + logging terstruktur
- Automated testing (unit + integration, minimal untuk kalkulasi saldo/budget)
- CI/CD via GitHub Actions (build → test → deploy ke VPS)
- Environment terpisah: dev / staging / prod
- Enkripsi data sensitif jika menyimpan info kartu/bank

---

## 5. Skema Database (Garis Besar)

```sql
users (id, email, password_hash, name, created_at, ...)

accounts (id, user_id, name, type, currency, initial_balance)

categories (id, user_id, name, type[income/expense], icon, color, parent_id)

transactions (
  id, account_id, category_id, amount, type,
  note, date, attachment_url, is_recurring_instance,
  is_deleted, created_at
)

recurring_rules (id, account_id, category_id, amount, frequency, next_run_date)

budgets (id, user_id, category_id, amount, period, start_date)

transfers (id, from_account_id, to_account_id, amount, date)

receipts (
  id, transaction_id, image_url,
  raw_ai_response JSONB,
  status[pending/confirmed/rejected],
  created_at
)

audit_logs (id, user_id, entity, entity_id, action, changes JSONB, created_at)
```

---

## 6. CI/CD & Build (GitHub Actions)

- **Web**: `vite build` → static files → rsync/scp ke VPS lewat Action
- **Android**: `npx cap sync android` → `gradlew assembleRelease` → artifact APK di Actions, atau upload otomatis ke Play Store (Fastlane)
- **iOS**: build di GitHub-hosted `macos-latest` runner → `xcodebuild` → upload ke TestFlight (catatan: menit runner macOS gratis lebih terbatas)
- **Backend**: build image Docker → push → deploy ke VPS via docker-compose

---

## 7. Roadmap Fase

1. **Fase 1 — Fondasi** (2–3 minggu): setup backend + skema DB + auth, deploy skeleton ke VPS dengan Docker
2. **Fase 2 — Core CRUD**: akun, kategori, transaksi (web dulu untuk iterasi cepat)
3. **Fase 3 — Laporan & Budget**: grafik, budget alert
4. **Fase 4 — Mobile app**: wrap dengan Capacitor, reuse API yang sudah jalan
5. **Fase 5 — Fitur AI**: integrasi scan struk via 9router/OpenRouter
6. **Fase 6 — Hardening**: testing, monitoring, backup, rate limiting, audit log
7. **Fase 7 — Fitur lanjutan**: recurring transaction, multi-currency, export, notifikasi push

---

## 8. Catatan Implementasi

- Implementasi kode akan dikerjakan menggunakan **Claude Sonnet 5 (high reasoning effort)**.
- File ini dimaksudkan sebagai starting point yang di-upload ke repository GitHub kosong, sebagai acuan awal sebelum inisialisasi project.
