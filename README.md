# Atlas REIT — Rental Portfolio Website

A modern, responsive marketing site for a real-estate investment trust with a
password-protected staff dashboard. Visitors filter listings by property type
(commercial / residential / warehouse), open a unit page, and send a short
enquiry — staff pick it up from the dashboard and follow up manually with the
application pack. No document uploads exist anywhere in the public flow.

**Full staff & hand-off documentation: [`docs/HANDOFF.md`](docs/HANDOFF.md)**

## Features

**Public site**
- Responsive home page (hero, portfolio stats, property types, featured units)
- Portfolio listing with type filters + “Available only” toggle
- Detailed unit pages: photo gallery, specs, features, price, availability
- Short enquiry form (name, email, phone, message — honeypot + rate limiting)
- Leased units stay visible with a “Leased” badge and a redirect to available units

**Staff dashboard (`/admin`)**
- Secure login (bcrypt-style scrypt hashes, signed 12-hour session cookie)
- Add / edit listings: photos, description, availability, pricing, features
- One-click **Mark leased / Mark available**, delete with confirmation
- Enquiry inbox: view, reply-by-email, set new → contacted → closed
- Export all enquiries to CSV (opens cleanly in Excel)
- Team accounts: admins add editors/admins; anyone can change their own password
- Role guard: only admins manage accounts

**Security**
- Edge middleware guards every `/admin` page and `/api/admin` endpoint
- HttpOnly + SameSite session cookies, signed with `AUTH_SECRET`
- Origin checks on every state-changing request (CSRF defence)
- Parameterised SQL everywhere; rate-limited login (5 tries → 60 s lockout)
- Public enquiry endpoint: honeypot + per-IP throttle + input validation

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
- Default login: `admin@atlasreit.com` / `AtlasREIT!2026`
  (override with `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env.local`, then change
  the password from Settings after first login)

A local Postgres is embedded automatically under `.data/` and seeded with a
demo portfolio — no external services required.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |

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

## Deployment (Vercel)

1. Push this repository to GitHub and import it in Vercel (framework: Next.js).
2. Attach a Postgres database (Marketplace → **Neon**) — this sets
   `POSTGRES_URL` automatically.
3. Set `AUTH_SECRET` (generate: `openssl rand -hex 32`), and optionally
   `ADMIN_EMAIL` / `ADMIN_PASSWORD` for the first-run administrator.
4. Optional photo uploads in production: attach a **Blob** store (injects
   `BLOB_READ_WRITE_TOKEN`). Without it, staff can still paste image URLs.
5. First visit runs the idempotent migrations + seed automatically — no
   manual DB setup.

See [`docs/HANDOFF.md`](docs/HANDOFF.md) for the complete staff workflow guide.
