# Atlas REIT — Hand-off Documentation

> Audience: leasing staff (non-technical) and the developer who inherits the
> site. Read time ≈ 10 minutes.
> Last updated: 17 November 2026.

---

## 1. What this site does

| | |
|---|---|
| **Public site** | Showcases the rental portfolio. Visitors filter by **Commercial / Residential / Warehouse**, open a unit, and send a short enquiry. |
| **Enquiry** | Name, email, optional phone/message. **No documents are ever uploaded by visitors.** |
| **Follow-up** | Your team replies manually by email with the full application pack. |
| **Dashboard** | Password-protected area where staff maintain listings and read enquiries. |

**Key URLs**

- Website: `https://<your-domain>/`
- Portfolio: `https://<your-domain>/properties`
- Dashboard: `https://<your-domain>/admin/login`

---

## 2. Signing in

1. Go to **`/admin/login`** (also linked as *Staff login* in the site footer).
2. Enter your email + password.
3. You stay signed in for **12 hours**; after that, simply log in again.

> 🔒 After 5 wrong passwords the form locks for 60 seconds — wait a minute and
> try again, or ask an admin to reset your password.

### Accounts & roles

| Role | Can do |
|---|---|
| **Editor** | Add/edit listings, mark leased, handle enquiries, change own password |
| **Admin** | Everything above **+ create/remove team accounts** |

The first administrator is created automatically on first run
(`ADMIN_EMAIL` in the environment). Change that password immediately after
first login (**Settings → Change my password**).

---

## 3. Everyday workflows

### 3.1 Add a new listing

1. Dashboard → **Listings → + New listing**.
2. Fill in the form:
   - **Title** — e.g. `Hydra Business Center — Floor 4`
   - **Property type** — Commercial / Residential / Warehouse
   - **Status** — leave as *Available*
   - **Rent per month (USD)** and **Area (m²)** — numbers only
   - **Bedrooms** — residential units only (leave blank otherwise)
   - **City / Address / Description** — description needs ≥ 20 characters
   - **Features** — one per line; they appear as bullet points on the unit page
   - **Feature this unit** — tick to show it on the home page
3. **Photos**
   - *Upload photo* button (JPG/PNG/WEBP/AVIF, max 6 MB), or
   - Paste a link (*Add link*).
   - The **first photo is the cover** shown in listing grids. Remove a photo
     with the red ×.
4. Press **Create listing** — it is live on the website immediately.

### 3.2 Edit a listing

**Listings → Edit** (or click the unit title). Change anything, then
**Save changes**. Use **View on site ↗** (top right) to preview the public page
in a new tab.

### 3.3 Mark a unit leased / available

In **Listings**, one click per row:

- **Mark leased** — unit keeps its public page but shows a *Leased* badge and
  the enquiry form is replaced by “This unit is leased”.
- **Mark available** — back on the market; enquiries reopen.

> The same unit page remains live either way — good for SEO and for tenants
> who bookmarked it.

### 3.4 Handle an enquiry

1. Dashboard → **Enquiries** — new items are highlighted.
2. Click **Open** to read the full message.
3. Click **Reply with application pack** — opens your email app with the
   visitor’s address, the property and a draft already filled in.
4. Update the status: **Mark contacted** once you reply, **Close enquiry**
   when done (or **Mark as new** to undo).
5. **Download CSV** (list or overview page) exports everything for spreadsheets
   — columns: Received, Property, Name, Email, Phone, Message, Status.

### 3.5 Manage the team (admins only)

**Settings → Team accounts**

- *Add a team member*: name, email, temporary password (≥ 8 chars), role.
  Hand the credentials over in person and tell them to change it.
- *Remove*: instantly revokes access. You cannot remove your own account or
  the last administrator.
- Forgotten password? An admin removes the account and re-creates it with a
  new temporary password.

---

## 4. Photo guidelines

- **Cover image**: 16:10 landscape, well-lit, ≥ 1200 px wide works best.
- Max 12 photos per unit, each ≤ 6 MB, formats JPG/PNG/WEBP/AVIF.
- On production, photo uploads need a **Blob store** on Vercel
  (Marketplace → Blob). Without it the upload button explains itself and
  staff can still *paste an image URL* — nothing breaks.
- Only upload photos you have the right to publish.

---

## 5. How enquiries travel (for the curious)

```
Visitor fills form on /properties/[id]
        ↓  (validation + spam checks: honeypot, rate limit, origin check)
Stored in the database table `enquiries`
        ↓
Appears in Dashboard → Enquiries  (+ CSV export)
        ↓
Staff replies by email with the application pack (manual follow-up)
```

There are **no email integrations or file uploads** on the public site by
design — the process stays human, exactly as requested.

---

## 6. For the developer

### Stack

- **Next.js 15** (App Router, TypeScript), **React 19**, **Zod**
- **PostgreSQL** — one dialect everywhere:
  - production: managed Postgres via `POSTGRES_URL` (Neon on Vercel)
  - development: embedded **PGlite** in `.data/` (git-ignored)
- **Auth**: scrypt password hashes (`node:crypto`), JWT sessions (`jose`)
  in HttpOnly SameSite cookies, verified at the edge (`src/middleware.ts`)
- Migrations are idempotent `CREATE TABLE IF NOT EXISTS` statements in
  `src/lib/migrate.ts`, executed once per process on first query — safe under
  concurrent serverless instances. First-run seed: `src/lib/seed.ts`.

### Local development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve production build
```

### Key files

| File | Purpose |
|---|---|
| `src/lib/db.ts` | Driver selection (Neon vs PGlite) + shared `query()` |
| `src/lib/migrate.ts` | Schema (users, listings, enquiries) |
| `src/lib/seed.ts` | Demo portfolio + first admin |
| `src/lib/session.ts` | JWT sign/verify, cookies, origin check |
| `src/middleware.ts` | Edge guard for `/admin` and `/api/admin` |
| `src/app/api/**` | All endpoints (auth, enquiries, CRUD, CSV, upload) |
| `src/app/globals.css` / `admin/admin.css` | Design system |

### Environment variables

| Key | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | ✅ prod + dev | Signs session tokens — `openssl rand -hex 32`. Rotating it logs everyone out (safe way to force re-login). |
| `POSTGRES_URL` | ✅ prod | Injected automatically when you attach Neon in Vercel. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | first run | Seeds the initial admin only if no user with that email exists. |
| `BLOB_READ_WRITE_TOKEN` | optional | Enables photo uploads in production (attach a Blob store). |
| `NEXT_PUBLIC_SITE_URL` | optional | Canonical URL for sitemap/OG metadata. |

### API surface (all JSON unless noted)

| Endpoint | Method | Auth |
|---|---|---|
| `/api/auth/login` · `/api/auth/logout` | POST | public / session |
| `/api/enquiries` | POST | public (throttled) |
| `/api/admin/listings` | POST | session |
| `/api/admin/listings/[id]` | PATCH, DELETE | session |
| `/api/admin/listings/[id]/status` · `/delete` | POST (form) | session |
| `/api/admin/enquiries/[id]/status` | POST (form) | session |
| `/api/admin/enquiries/export` | GET → CSV | session |
| `/api/admin/upload` | POST (multipart) | session |
| `/api/admin/password` | POST | session |
| `/api/admin/users` · `/api/admin/users/[id]` | POST | admin |

### Scaling notes

- Stateless JWT sessions → any number of serverless instances, no sticky state.
- DB is the only shared state; PGlite is dev-only, so `npm run build` output
  runs anywhere Next.js runs.
- Rate limits/login throttles are per-instance by design (defence in depth);
  add Vercel WAF rules if traffic demands it.
- To go bigger later: swap `pg` pool size, add read replicas, or move
  enquiries to an email webhook — the data layer is one file (`src/lib`).

---

## 7. Launch checklist

- [ ] Change the seeded admin password after first login
- [ ] Add the rest of the team (Settings → Team accounts)
- [ ] Attach Neon (Postgres) to the Vercel project
- [ ] Set `AUTH_SECRET` in Vercel → Settings → Environment Variables
- [ ] Attach a Blob store if you want photo uploads in production
- [ ] Replace seed listings/photos with the real portfolio
- [ ] Update footer contact details (`src/components/site-footer.tsx`)
- [ ] Attach a custom domain (Vercel → Project → Domains) and set
      `NEXT_PUBLIC_SITE_URL`
- [ ] Send one test enquiry end-to-end and confirm it lands in the dashboard
