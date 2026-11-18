# Atlas REIT business rules implementation status

Updated 17 November 2026. Development hand-off only; not legal/accounting advice and not a production-readiness declaration.

## Implemented in this branch

- Staff roles and server-side permission checks for core property, leasing, maintenance, financial, settings, and account operations; relevant administration pages are role restricted. Every current `/api/admin/**/route.ts` explicitly rejects a missing or revoked DB-resolved session in its handler (not only in middleware), with a regression test guarding future handlers. Session versions support revocation after account or credential changes. A human endpoint-by-endpoint authorization review remains necessary.
- Lease renewal proposal/review/approval with retained old lease history and overlap checks. A requester cannot approve their own renewal or termination; the same separation is enforced when approving new leases.
- Lease early termination with manager approval, configurable exception terms, actual-days current-period proration, the effective date treated as the first unoccupied/non-billed day, preservation of issued invoice history, cancellation/credit of future unearned receivables, separate tenant-credit ledger, and audit events. No automatic termination penalty is imposed.
- Atomic payment registration/allocation, partial-payment balance handling, idempotent invoice issuance, and separately audited refund/void requests with distinct approver; self-approval is rejected.
- Security-deposit receipt ledger separate from rent, balance-aware documented deduction requests and manager approval, partial/full refund ledger, and balance checks that prevent deductions/refunds beyond available funds.
- Configurable invoice tax/fee/lease-notice/late-fee settings. Defaults are zero/disabled; changing policy does not silently rewrite issued invoices. Legal/accounting approval is still required before enabling nonzero taxes or fees.
- Duplicate-safe lease end reminders at configured 90/60/30-day thresholds, shown in administration dashboard. Daily Vercel Cron configuration exists. Reminder email delivery is deliberately not enabled.
- Tenant portal with tenant-scoped lease/invoice/payment/credit/maintenance data. Invitation and reset flows use random one-time tokens stored as hashes, expiration, invalidation on replacement, generic reset responses and DB-backed request/login rate limits. Self-registration sends a six-digit email code with HMAC-at-rest, expiry, attempt/rate limits, one-time consumption, existing-tenant linking only after mailbox verification, and blocks reactivation of disabled accounts. Optional Google OIDC for tenant accounts validates ID-token signature, issuer, audience, verified email, nonce and signed OAuth state, uses PKCE S256, and uniquely links the stable Google `sub`. New Google sign-ins can create a tenant record; staff/admin login remains email/password. Test email provider captures messages in memory and sends no real mail.
- Added enquiry/listing page permission checks and portal credit visibility. Credits are explicitly separate balances and are not automatically netted against invoices.

## Verification run on current worktree

- `npm test`: 12/12 business-rule tests passed against isolated temporary PGlite. Coverage includes complete role matrix and explicit session guards for every admin API route, Google OAuth state/nonce/PKCE challenge tampering, six-digit registration code hashing/expiry/one-time use and existing tenant linking/disabled-account protection, partial/concurrent payment allocations, self-approval, deposit deduction documents/balances, renewal overlap, duplicate reminders, concurrent invitation redemption, rate limits, tenant data isolation, and termination proration/history/credit.
- `npm run build`: passed (Next.js production build; two existing `<img>` optimization warnings on public home page).
- `npx tsc --noEmit`: passed.
- `npm audit`: 0 vulnerabilities.
- `git diff --check`: passed.
- Temporary HTTP smoke tests: built app public invite/forgot/reset pages returned 200 and a valid JWT for a nonexistent/revoked staff user was rejected with 401; a dev server rendered `/portal/register` (200), rejected a registration POST without Origin (403), accepted a valid-origin registration request with the non-delivering test mail provider (200), and redirected unconfigured Google sign-in back to the portal with an explicit unavailable status. Servers were stopped and throwaway PGlite files removed.
- ESLint was not part of the repository's initial scripts/dependencies. Temporary attempts to add a linter surfaced vulnerable transitive lint-only dependencies (audit reported high-severity advisories), so those dependencies/config were removed rather than increasing the dependency attack surface. Next build's built-in lint/type phase completed with only the two image warnings; a standalone ESLint pass is not claimed.
- PostgreSQL integration test support is present via `ATLAS_TEST_POSTGRES_URL`, with a uniquely named isolated schema and a database-name safety guard, but it was not run because no test PostgreSQL URL/server is configured here. PGlite is not a substitute for production-compatible PostgreSQL verification.
- No E2E browser suite was available or run. No production database, Vercel deployment, real email, credentials, or secrets were accessed/changed.

## External setup before any real use

- For tenant email, configure `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM`, public `APP_BASE_URL`, and optional invitation/reset/registration-code TTLs. No credentials are included. `EMAIL_PROVIDER=test` is non-delivering.
- To enable tenant Google login, configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` securely and register the exact `https://<domain>/api/tenant-auth/google/callback` URI in Google Cloud Console. OAuth has not been exercised against live Google because no credentials/provider were supplied.
- Set `CRON_SECRET` in the deployment environment to protect scheduled reminders. Cron email delivery is not implemented.
- Run PostgreSQL integration tests only against a disposable DB named with `test` or `ci` by setting `ATLAS_TEST_POSTGRES_URL`; never use production. Managed Postgres TLS certificate verification is now enabled by default; configure `PGSSL_CA` only when a private CA is required.
- Confirm legal contract wording, proration/termination exceptions, invoice/tax/fee policy, approval delegation, deposit evidence retention, and data retention with qualified local operators/advisors before relying on financial outputs.
- Review legacy currency classification/approved exchange rate before applying migrations to existing real data. No migration has been applied to production.

## Still required before release

- PostgreSQL-compatible integration run and migration review against a disposable production-version database; verify schema setup, transaction locking, range/exclusion behavior, numeric/date behavior and rollback.
- Complete role-by-role audit of every server action/API/page, especially reports, uploads/documents, tenant/account administration, and all cross-tenant access; test unauthorized roles with integration tests.
- Browser E2E for invite/reset/login middleware, lease/deposit/payment workflows, responsive RTL screens and failure/duplicate submissions.
- Operational decisions and external email/cron configuration; verify backup/restore and migration rollback on a staging copy.
- No claim of production readiness until the above gates pass and a human security/accounting/legal review accepts the workflows.
