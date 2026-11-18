# Atlas REIT — Hand-off Documentation

> Audience: leasing staff (non-technical) and the developer who inherits the
> site. Read time ≈ 10 minutes.
> Last updated: 17 November 2026.

---

## 1. What this site does

The current interface is Arabic (RTL), and rental prices are denominated in Algerian dinars (DZD / دج).

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

> 🔒 Six failed attempts for an account or IP trigger a persistent 10-minute
> lockout. New and changed staff passwords require at least 12 characters with
> uppercase, lowercase and a number. Sessions use HttpOnly/SameSite cookies;
> changing a password or disabling an account revokes its other sessions.

### Accounts & roles

| Role | Initial permissions (enforced by server routes) |
|---|---|
| **موظف عقاري** | العقارات والوحدات والعملاء والزيارات وطلبات العقود والصيانة |
| **مدير العقارات** | عمليات العقارات واعتماد العقود والإنهاء واقتطاعات الضمان وأوامر العمل |
| **محاسب** | تسجيل الدفعات والمصروفات والضمانات وطلب تسوية/رد الدفعات |
| **المدير العام** | إعدادات الموقع والأدوار واعتماد التسويات المالية والعمليات الحساسة |
| **مدير النظام** | صلاحيات كاملة وإدارة حسابات الفريق |
| **محرر (قديم)** | دور توافق انتقالي للحسابات القديمة؛ يُنقل إلى الدور المحدد عند مراجعة الحساب |

The first administrator is created only when `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` are provided in the environment. There is no hard-coded default password; change the initial password after first login.

---

## 3. Everyday workflows

### 3.1 Add a new listing

1. Dashboard → **Listings → + New listing**.
2. Fill in the form:
   - **Title** — e.g. `Hydra Business Center — Floor 4`
   - **Property type** — Commercial / Residential / Warehouse
   - **Status** — leave as *Available*
   - **Rent per month (DZD)** and **Area (m²)** — numbers only
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
- *Disable account*: preserves the account history and immediately revokes
  active sessions. You cannot disable your own account or the last active admin.
- Forgotten password? An admin removes the account and re-creates it with a
  new temporary password.

### 3.6 Properties, units, owners and portfolios

Use **Properties**, **Units**, **Owners** and **Portfolios** in the dashboard.
Create owners/portfolios first if you want to link them to a property; add units
under a property. Existing public listings retain their IDs and are bridged to
one property and one unit. Do not delete a legacy listing to archive an asset:
financial records and signed agreements should remain intact.

### 3.7 CRM and visits

**Leads** contains new website enquiries and manually entered prospects. Use
stage changes to track follow-up; the system records the stage history. **Visits**
lets staff schedule property viewings and prevents the same unit or staff member
from being double-booked at the same time.

### 3.8 Tenants, leases and rent collection

1. Add the tenant under **Tenants**.
2. Create a lease under **Leases**, selecting a unit and primary tenant; it is
   immediately submitted for approval.
3. An administrator reviews and **approves** the lease. Only an approved lease
   can be activated. Activation checks date overlap, marks the unit leased, and
   creates scheduled rent invoices (plus a deposit line on the initial invoice
   when a deposit is specified).
4. Under **Invoices**, review balances and due dates. Under **Payments**, record
   a payment and allocate its full amount across one or more open invoices. The
   same invoice cannot be overpaid by concurrent payment submissions.

This is an initial operational workflow, not a jurisdiction-ready lease-signing
or accounting system. It does not generate signed legal documents, track bank
reconciliation, or replace professional accounting. Validate invoice periods,
tax treatment, deposit handling and contract clauses with the business before
using real transactions.

### 3.9 Expenses, maintenance and reports

Use **Expenses** to register a DZD expense against a property/unit. Use
**Maintenance** to log a unit issue, set priority, and move it through its
allowed status transitions. Add vendors and create work orders there; approval
is restricted to administrators. Completing a work order creates an unpaid
maintenance expense for its final cost. **Reports** summarizes occupancy,
invoice collection, overdue balances, leases nearing end, leads and expenses;
treat these as operational indicators and reconcile against source records.
Administrators can review recorded changes under **Audit log**.

### 3.10 DZD prices, USD conversion and contact details

All property prices and recorded financial values remain in **Algerian dinars
(DZD / دج)**. At **Settings → Site contact and exchange rate**, an administrator
may set the DZD value for one USD and add email, phone, WhatsApp, address, and
social/site links. Empty contact fields stay hidden in the public footer. No
exchange rate is assumed or fetched automatically; the public calculator uses
the manually configured rate and is indicative only. The seeded portfolio
prices are illustrative demo data, not offers or market valuations.

---

### 3.11 بوابة المستأجر

من **Tenants** يرسل المدير دعوة إلى البريد المسجل. لا تعرض الواجهة كلمة مرور
مؤقتة؛ يتطلب الإرسال مزود بريد مضبوطاً. يفتح المستأجر رابطاً عشوائياً أحادي
الاستخدام ومنتهي الصلاحية ليختار كلمة المرور بنفسه، ويمكنه طلب إعادة تعيينها من
`/portal/forgot-password` برسالة عامة لا تكشف وجود الحساب. تعرض البوابة عقود
المستأجر وفواتيره وإيصالاته وأرصدة دائنة منفصلة، وتسمح بإرسال بلاغ صيانة لوحدة
مرتبطة بعقد نشط. الروابط السابقة تُبطل عند إصدار رابط جديد. لا يوجد دفع إلكتروني
أو مقاصة تلقائية للأرصدة الدائنة.

### 3.12 تجديد وإنهاء العقد والضمان

من **Leases** تُراجع العقود القريبة من الانتهاء وطلبات التجديد أو الإنهاء. يراجع
المدير المدة/الإيجار الجديدين أو تاريخ الإنهاء والاستثناء التعاقدي؛ يُحفظ العقد
السابق ولا يسمح بتداخل فترات الوحدة. طلب المنشئ لا يعتمد من المنشئ نفسه. الإنهاء
يحسب الإيجار للفترة الحالية على الأيام الفعلية، ويعامل يوم النفاذ كأول يوم غير
مشغول، ويحفظ الفواتير الصادرة ويسجل الرصيد الدائن أو التعديل بدلاً من حذفها؛ لا
تفرض غرامة تلقائية.

في **Deposits** يسجل المحاسب قبض الضمان وطلب الاقتطاع مع السبب والمستندات، ثم
يعتمده مستخدم مخول آخر. تسجل المبالغ المرتجعة كلياً أو جزئياً مع منع تجاوز الرصيد.
في **Payments** يطلب الموظف رد/إلغاء الدفعة، ويعتمدها شخص مخول آخر. هذه العمليات
تظل قيوداً منفصلة ومدققة، وليست حذفاً للسجلات السابقة.

### 3.13 تنبيهات العقود

تظهر تنبيهات 90/60/30 يوماً في لوحة الإدارة، ويمنع السجل تكرار التنبيه نفسه.
تُشغّل المهمة اليومية عبر Vercel Cron وتتطلب `CRON_SECRET`. البريد الخاص بالتنبيهات
غير مفعل حالياً.

**إعداد البريد:** يلزم `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`,
و`APP_BASE_URL` عام وآمن (`https` في الإنتاج). الاختبارات تستخدم مزوداً تجريبياً
لا يرسل أي رسالة حقيقية. لا تضع بيانات اعتماد البريد في Git.

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
| `src/lib/migrate.ts` | Idempotent schema for listings, assets, CRM, leases, finance, maintenance and audit logs |
| `src/lib/seed.ts` | Demo portfolio + first admin |
| `src/lib/assets.ts`, `src/lib/crm.ts` | Property/unit and lead/visit queries |
| `src/lib/leasing.ts`, `src/lib/finance.ts` | Lease workflow, invoice schedule, payment allocation |
| `src/lib/operations.ts` | Maintenance, expense and operational audit records |
| `src/lib/session.ts` | JWT sign/verify, cookies, origin check |
| `src/middleware.ts` | Edge guard for `/admin` and `/api/admin` |
| `src/app/api/**` | All endpoints (auth, enquiries, CRUD, CSV, upload) |
| `src/app/globals.css` / `admin/admin.css` | Design system |

### Environment variables

| Key | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | ✅ prod + dev | Signs session tokens — `openssl rand -hex 32`. Rotating it logs everyone out (safe way to force re-login). |
| `POSTGRES_URL` | ✅ prod | Injected automatically when you attach Neon in Vercel. |
| `LEGACY_LISTINGS_CURRENCY` | Existing DB only | Set `USD` or `DZD` before first upgraded startup. If USD, also set the approved `LEGACY_LISTINGS_USD_TO_DZD_RATE`; otherwise the migration fails closed rather than mislabeling existing prices. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | first run | Seeds the initial admin only if no user with that email exists. |
| `BLOB_READ_WRITE_TOKEN` | optional | Enables photo uploads in production (attach a Blob store). |
| `NEXT_PUBLIC_SITE_URL` | optional | Canonical URL for sitemap/OG metadata. |
| `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_BASE_URL` | tenant email | Required to send account invitations/resets. Use HTTPS `APP_BASE_URL` in production; no credentials are committed. |
| `TENANT_INVITE_TTL_MINUTES`, `TENANT_RESET_TTL_MINUTES` | optional | Expiration windows for account invite and password-reset links. |
| `CRON_SECRET` | Vercel Cron | Protects the scheduled lease reminder endpoint. |
| `PGSSL_CA` | optional | PEM CA for private PostgreSQL installations; normal TLS certificate verification remains enabled. |
| `ATLAS_TEST_POSTGRES_URL` | tests only | Disposable PostgreSQL database named with `test` or `ci`; never point to production. |

### API surface (all JSON unless noted)

Admin route handlers resolve the current staff session against the database (a valid but revoked JWT is not sufficient), then apply role checks; state-changing requests check Origin. Approval and financial operations require a separate authorized approver where applicable.

| Endpoint family | Methods / purpose |
|---|---|
| `/api/auth/*`, `/api/enquiries` | Login/logout; public enquiry submission |
| `/api/admin/listings/*`, `/api/admin/properties`, `/api/admin/units` | Listings and normalized assets |
| `/api/admin/owners`, `/api/admin/portfolios` | Owner and portfolio records |
| `/api/admin/leads`, `/api/admin/leads/[id]/stage`, `/api/admin/visits` | CRM and viewing schedules |
| `/api/admin/tenants`, `/api/admin/tenants/[id]/portal-access`, `/api/admin/leases` | Tenant records, email invitations, and lease creation |
| `/api/tenant-auth/*`, `/api/tenant/*` | Tenant login/logout/password and tenant-scoped portal data/maintenance |
| `/api/admin/leases/[id]/approve`, `/activate`, `/renewals`, `/termination`, `/api/admin/lease-renewals/*`, `/api/admin/lease-terminations/*` | Lease approval, activation, renewal and termination workflow |
| `/api/admin/payments`, `/api/admin/payments/[id]/reversals`, `/api/admin/payment-reversals/*`, `/api/admin/expenses` | Payments, allocated receipts, separate refund/void approval, and expense entry |
| `/api/admin/deposits/*`, `/api/admin/deposit-deductions/*` | Security-deposit receipts, deductions and refunds |
| `/api/admin/maintenance/*`, `/api/admin/vendors`, `/api/admin/work-orders/*` | Maintenance issues, vendors and work orders |
| `/api/admin/enquiries/*`, `/api/admin/upload`, `/api/admin/password`, `/api/admin/users/*` | Enquiries, CSV, uploads, password and staff management |

### Scaling notes

- Stateless JWT sessions → any number of serverless instances, no sticky state.
- DB is the only shared state; PGlite is dev-only, so `npm run build` output
  runs anywhere Next.js runs.
- Staff login failures and tenant invitation/reset request limits use shared database buckets. Public enquiry spam throttling remains per-instance (8/min/IP); add platform WAF/rate limiting for a multi-instance deployment.
- To go bigger later: swap `pg` pool size, add read replicas, or move
  enquiries to an email webhook — the data layer is one file (`src/lib`).

---

## 7. Pre-release gates — not yet completed

These steps require an explicitly approved staging environment and qualified reviewers. No production deployment or production database migration has been performed.

- [ ] Run `npm run test:postgres` with `ATLAS_TEST_POSTGRES_URL` pointing only to a disposable PostgreSQL database whose name contains `test` or `ci`; inspect migration and transaction behavior.
- [ ] Complete browser E2E across staff login/roles, tenant invite/reset, lease renewal/termination, deposits, payments, alerts, and responsive RTL.
- [ ] Complete independent role-by-role/API/page authorization and tenant-isolation review, including upload/document access.
- [ ] Validate database backup, restore, migration rollback and preserved legacy currency/data on a staging copy.
- [ ] Approve lease wording, proration, deposits, fees/taxes, retention and approval policy with local legal/accounting operators.
- [ ] Configure production secrets/email/Cron and any storage only through the deployment's secure environment; test delivery using a non-production recipient.
- [ ] Reconcile seeded/demo data and replace it only after an owner-approved data migration plan.

Passing the local PGlite suite and build is not a release approval. Do not check these gates as complete based solely on this local worktree.
