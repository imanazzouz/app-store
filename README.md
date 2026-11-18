# Atlas REIT — منصة إدارة المحفظة العقارية

A modern, responsive marketing site for a real-estate investment trust with a
password-protected staff dashboard. Visitors browse Arabic, right-to-left listings in Algerian dinars (DZD) by property type
(commercial / residential / warehouse), open a unit page, and send a short
enquiry — staff pick it up from the dashboard and follow up manually with the
application pack. No document uploads exist anywhere in the public flow.

**Full staff & hand-off documentation: [`docs/HANDOFF.md`](docs/HANDOFF.md)**

## Features

**Public site**
- Arabic RTL portfolio in DZD with filters, property details, availability and enquiries
- Demo seed listings carry illustrative DZD rents
- Public USD→DZD calculator uses the admin-configured rate; no rate is assumed or fetched automatically
- Contact links are omitted until the site administrator configures them

**Staff dashboard (`/admin`)**
- Properties, units, owners, portfolios, enquiries, CRM leads, stages and viewing schedules
- Tenants and lease approval/activation, early termination with actual-day proration, invoice credits, renewal requests and manager approval
- Security deposits with actual receipts, balance tracking, documented deduction requests, separate approval and recorded refunds
- Partial/multiple invoice payments, receipts, refund/void approval, and audit history
- Lease-end reminders at configurable 90/60/30-day thresholds (daily Vercel Cron; duplicate-safe)
- Expenses, maintenance issues, vendors and work orders; completed work orders create linked expenses
- Occupancy, collections and operations reports; admin audit log
- Role-managed team accounts, configurable invoice/termination policy defaults, contact/exchange settings
- Tenant portal: tenant-scoped leases/invoices/receipts/credits, one-time invitations and six-digit email-verified self-registration, optional Google OIDC sign-in, self-service password reset and maintenance requests

**Security**
- Signed 12-hour HttpOnly/SameSite sessions checked against active users and session versions
- Persistent DB-backed lockout (6 failures → 10 minutes), generic login errors and password-strength requirements for new/changed passwords
- Origin checks on state-changing requests, role checks on sensitive actions, and password/account changes revoke other sessions
- Tenant invitation/reset tokens are random, hashed at rest, expire, are single-use, and are invalidated when a newer token is issued; public reset requests use generic responses and rate limits
- Tenant portal queries are scoped to the authenticated tenant; tests use a non-delivering mail outbox
- Seed/admin credentials must be set explicitly; no default password is provided

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Database | PostgreSQL — managed (Neon) in production, embedded (PGlite) locally |
| Validation | Zod |
| Sessions | JWT (`jose`) in HttpOnly cookies — no server session store needed |
| Styling | Hand-written modern CSS (no framework), system font stack, fast loads |
| Hosting | Vercel (zero-config) |

The SQL dialect is identical locally and in production, so nothing changes
between development and deploy except one environment variable.

## Quick start (local development)

```bash
npm install
npm run dev
```

- Site → http://localhost:3000
- Dashboard → http://localhost:3000/admin/login
- There is no default password. Set `ADMIN_EMAIL`, a strong `ADMIN_PASSWORD`, and `AUTH_SECRET` in `.env.local` before first sign-in.
  The first administrator is seeded from these values; never reuse credentials from an example.

A local Postgres is embedded automatically under `.data/` and seeded with a
demo portfolio in DZD — no external services required. Without `ADMIN_PASSWORD`, local admin access is intentionally not seeded.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm test` | Business workflow tests on isolated PGlite (no email delivery) |
| `npm run test:postgres` | Same integration suite against an isolated schema in a disposable PostgreSQL test DB (`ATLAS_TEST_POSTGRES_URL` required) |

## Project structure

```
src/
  app/                 Public pages: /, /properties, /properties/[id]
    (public)/          Route group with header/footer
    admin/             Staff dashboard (login, overview, listings, enquiries, settings)
    api/               REST endpoints (auth, enquiries, admin CRUD, CSV, uploads)
  components/          Reusable UI (cards, filters, forms, galleries)
  lib/                 Data layer (db, listings, enquiries), auth, sessions, CSV, validation
  middleware.ts        Edge guard for every /admin route
docs/HANDOFF.md        Staff workflow + hand-off documentation
public/img/            Property photography
```

## Optional services

Tenant email is disabled until configured. In production set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, and the public `APP_BASE_URL`; invitation/reset expiries are controlled by `TENANT_INVITE_TTL_MINUTES` and `TENANT_RESET_TTL_MINUTES`. Self-registration emails a six-digit verification code; its expiry is controlled by `TENANT_REGISTRATION_CODE_TTL_MINUTES`. No provider credentials belong in Git. Tests set `EMAIL_PROVIDER=test` and capture messages in memory without sending them.

Tenant portal Google sign-in is optional: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the secure environment, enable Google OpenID Connect with `openid email profile`, and add the exact callback URI `https://your-domain/api/tenant-auth/google/callback` in Google Cloud Console. Verified email is required; OAuth state, nonce, PKCE S256, issuer, audience and stable Google subject are validated. Staff/admin login remains email/password only. Configure a private database CA with `PGSSL_CA` if needed; TLS certificate verification stays enabled.

`vercel.json` schedules the idempotent lease reminder endpoint daily. Set `CRON_SECRET` in the deployment environment; email delivery for reminders is not enabled by this task.

For PostgreSQL integration tests, set `ATLAS_TEST_POSTGRES_URL` to a disposable database whose name includes `test` or `ci`. The test creates and drops only its own uniquely named schema. Never point this variable at production.

## Deployment (Vercel)

1. Push this repository to GitHub and import it in Vercel (framework: Next.js).
2. Attach a Postgres database (Marketplace → **Neon**) — this sets
   `POSTGRES_URL` automatically.
3. Set `AUTH_SECRET` (generate: `openssl rand -hex 32`), and optionally
   `ADMIN_EMAIL` / `ADMIN_PASSWORD` for the first-run administrator.
4. Set a strong `ADMIN_PASSWORD` for the initial admin. Optional photo uploads in production: attach a **Blob** store (injects
   `BLOB_READ_WRITE_TOKEN`). Without it, staff can still paste image URLs.
5. First visit runs the idempotent migrations + seed automatically — no
   manual DB setup.

See [`docs/HANDOFF.md`](docs/HANDOFF.md) for the complete staff workflow guide.
