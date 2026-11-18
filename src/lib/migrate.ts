import type { Db } from './db';

/**
 * Idempotent schema migrations — safe to run on every cold start and from
 * several serverless instances at once (all statements are IF NOT EXISTS).
 */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'editor',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  active        BOOLEAN NOT NULL DEFAULT true,
  session_version INTEGER NOT NULL DEFAULT 1,
  last_login_at TIMESTAMPTZ
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','editor','property_staff','property_manager','accountant','general_manager'));

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value TEXT NOT NULL DEFAULT '',
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS auth_login_attempts (
  identifier_hash TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('commercial','residential','warehouse')),
  status      TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','leased')),
  price       NUMERIC(14,2) NOT NULL,
  currency    CHAR(3) NOT NULL DEFAULT 'DZD' CHECK (currency = 'DZD'),
  area_sqm    INTEGER NOT NULL,
  beds        INTEGER,
  address     TEXT NOT NULL DEFAULT '',
  city        TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  features    TEXT NOT NULL DEFAULT '',
  images      TEXT NOT NULL DEFAULT '[]',
  featured    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS currency CHAR(3);
ALTER TABLE listings ALTER COLUMN price TYPE NUMERIC(14,2);

CREATE TABLE IF NOT EXISTS enquiries (
  id         SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_type   ON listings(type);
CREATE INDEX IF NOT EXISTS idx_enquiries_time  ON enquiries(created_at DESC);
`;

const ASSET_SCHEMA = `
CREATE TABLE IF NOT EXISTS owners (
  id SERIAL PRIMARY KEY,
  owner_type TEXT NOT NULL DEFAULT 'individual' CHECK (owner_type IN ('individual','company')),
  legal_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  mailing_address TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('commercial','residential','warehouse','mixed')),
  description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  wilaya TEXT NOT NULL DEFAULT '',
  municipality TEXT NOT NULL DEFAULT '',
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  construction_year INTEGER,
  total_area_sqm NUMERIC(12,2),
  operating_status TEXT NOT NULL DEFAULT 'active' CHECK (operating_status IN ('active','under_maintenance','inactive')),
  owner_id INTEGER REFERENCES owners(id) ON DELETE SET NULL,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE SET NULL,
  legacy_listing_id INTEGER UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS units (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('commercial','residential','warehouse')),
  floor TEXT NOT NULL DEFAULT '',
  area_sqm NUMERIC(12,2) NOT NULL CHECK (area_sqm > 0),
  bedrooms INTEGER,
  asking_rent NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (asking_rent >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'DZD' CHECK (currency = 'DZD'),
  rent_period TEXT NOT NULL DEFAULT 'monthly' CHECK (rent_period IN ('monthly','quarterly','semiannual','annual')),
  proposed_deposit NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (proposed_deposit >= 0),
  operating_status TEXT NOT NULL DEFAULT 'active' CHECK (operating_status IN ('active','maintenance','out_of_service')),
  occupancy_status TEXT NOT NULL DEFAULT 'vacant' CHECK (occupancy_status IN ('vacant','reserved','leased')),
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  internal_notes TEXT NOT NULL DEFAULT '',
  legacy_listing_id INTEGER UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, code)
);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_portfolio ON properties(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(operating_status, occupancy_status);
`;

const CRM_SCHEMA = `
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  enquiry_id INTEGER UNIQUE REFERENCES enquiries(id) ON DELETE SET NULL,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual',
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new','contacted','qualified','visit_scheduled','visited','offer_sent','negotiating','won','lost')),
  assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  follow_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lead_stage_history (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  old_stage TEXT,
  new_stage TEXT NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call','email','note','follow_up')),
  body TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  outcome TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  proposed_rent NUMERIC(14,2) NOT NULL CHECK (proposed_rent >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'DZD' CHECK (currency = 'DZD'),
  rent_period TEXT NOT NULL DEFAULT 'monthly' CHECK (rent_period IN ('monthly','quarterly','semiannual','annual')),
  proposed_deposit NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (proposed_deposit >= 0),
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','sent','accepted','rejected','expired')),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_stage ON leads(assigned_user_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled ON visits(scheduled_at, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_visits_unit_slot ON visits(unit_id, scheduled_at) WHERE status = 'scheduled' AND unit_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_visits_staff_slot ON visits(assigned_user_id, scheduled_at) WHERE status = 'scheduled' AND assigned_user_id IS NOT NULL;
`;

const LEASING_SCHEMA = `
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  tenant_type TEXT NOT NULL DEFAULT 'individual' CHECK (tenant_type IN ('individual','company')),
  legal_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  mailing_address TEXT NOT NULL DEFAULT '',
  portal_password_hash TEXT,
  portal_active BOOLEAN NOT NULL DEFAULT false,
  portal_session_version INTEGER NOT NULL DEFAULT 1,
  password_change_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS portal_password_hash TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS portal_active BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS portal_session_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS portal_email_verified_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_subject TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_google_subject ON tenants(google_subject) WHERE google_subject IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_active_portal_email ON tenants(lower(email)) WHERE portal_active=true AND email<>'';
CREATE TABLE IF NOT EXISTS tenant_registration_challenges (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  code_hash CHAR(64) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_registration_active_email ON tenant_registration_challenges(lower(email)) WHERE consumed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_registration_expiry ON tenant_registration_challenges(expires_at);
CREATE TABLE IF NOT EXISTS leases (
  id SERIAL PRIMARY KEY,
  lease_number TEXT NOT NULL UNIQUE,
  unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  signed_at DATE,
  rent_amount NUMERIC(14,2) NOT NULL CHECK (rent_amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'DZD' CHECK (currency = 'DZD'),
  rent_period TEXT NOT NULL DEFAULT 'monthly' CHECK (rent_period IN ('monthly','quarterly','semiannual','annual')),
  due_day INTEGER NOT NULL DEFAULT 1 CHECK (due_day BETWEEN 1 AND 28),
  security_deposit NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (security_deposit >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','active','terminated','expired','cancelled')),
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  terminated_at DATE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS terminated_at DATE;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS renewed_from_lease_id INTEGER REFERENCES leases(id) ON DELETE RESTRICT;
CREATE TABLE IF NOT EXISTS lease_renewal_requests (
  id SERIAL PRIMARY KEY,
  source_lease_id INTEGER NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
  new_start_date DATE NOT NULL,
  new_end_date DATE NOT NULL,
  new_rent_amount NUMERIC(14,2) NOT NULL CHECK (new_rent_amount > 0),
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK(status IN ('pending_approval','approved','rejected')),
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  request_note TEXT NOT NULL DEFAULT '',
  decided_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  decision_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  CHECK(new_end_date>new_start_date)
);
ALTER TABLE lease_renewal_requests ADD COLUMN IF NOT EXISTS request_note TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_lease_renewal_pending ON lease_renewal_requests(source_lease_id) WHERE status='pending_approval';
CREATE TABLE IF NOT EXISTS tenant_auth_tokens (
  id BIGSERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  purpose TEXT NOT NULL CHECK(purpose IN ('invite','password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_auth_tokens_active ON tenant_auth_tokens(tenant_id,purpose,expires_at) WHERE consumed_at IS NULL;
CREATE TABLE IF NOT EXISTS tenant_auth_request_limits (
  id BIGSERIAL PRIMARY KEY,
  request_key CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_auth_request_limits_key_date ON tenant_auth_request_limits(request_key,created_at DESC);
CREATE TABLE IF NOT EXISTS tenant_auth_rate_buckets (
  request_key CHAR(64) PRIMARY KEY,
  window_started TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lease_tenants (
  lease_id INTEGER NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (lease_id, tenant_id)
);
CREATE TABLE IF NOT EXISTS lease_status_history (
  id SERIAL PRIMARY KEY,
  lease_id INTEGER NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lease_termination_requests (
  id SERIAL PRIMARY KEY,
  lease_id INTEGER NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
  effective_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval','approved','rejected')),
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  decided_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  decision_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lease_termination_pending ON lease_termination_requests(lease_id) WHERE status='pending_approval';
CREATE TABLE IF NOT EXISTS lease_notifications (
  id SERIAL PRIMARY KEY,
  lease_id INTEGER NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
  days_before INTEGER NOT NULL CHECK (days_before IN (90,60,30)),
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  UNIQUE(lease_id,days_before)
);
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  lease_id INTEGER NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  issued_at DATE NOT NULL,
  due_date DATE NOT NULL,
  amount_due NUMERIC(14,2) NOT NULL CHECK (amount_due >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'DZD' CHECK (currency = 'DZD'),
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('draft','issued','partially_paid','paid','void')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lease_id, period_start),
  CHECK (period_end >= period_start)
);
CREATE TABLE IF NOT EXISTS invoice_lines (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_amount NUMERIC(14,2) NOT NULL CHECK (unit_amount >= 0),
  line_amount NUMERIC(14,2) NOT NULL CHECK (line_amount >= 0)
);
CREATE TABLE IF NOT EXISTS invoice_adjustments (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  termination_request_id INTEGER REFERENCES lease_termination_requests(id) ON DELETE RESTRICT,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('credit','cancellation','tax','fee','write_off')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount <> 0),
  description TEXT NOT NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(invoice_id,termination_request_id)
);
CREATE TABLE IF NOT EXISTS tenant_credit_transactions (
  id SERIAL PRIMARY KEY,
  lease_id INTEGER NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE RESTRICT,
  termination_request_id INTEGER NOT NULL REFERENCES lease_termination_requests(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK(amount>0),
  transaction_type TEXT NOT NULL CHECK(transaction_type IN ('credit','applied','refund')),
  description TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(termination_request_id,invoice_id,transaction_type)
);
ALTER TABLE lease_termination_requests ADD COLUMN IF NOT EXISTS exception_terms TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  idempotency_key TEXT UNIQUE,
  receipt_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'DZD' CHECK (currency = 'DZD'),
  payment_date DATE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash','bank_transfer','cheque','card','other')),
  reference TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','void')),
  notes TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
CREATE TABLE IF NOT EXISTS payment_allocations (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(payment_id, invoice_id)
);
CREATE TABLE IF NOT EXISTS payment_reversals (
  id SERIAL PRIMARY KEY,
  payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  reversal_type TEXT NOT NULL CHECK (reversal_type IN ('refund','void')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash','bank_transfer','cheque','card','other')),
  reference TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval','approved','rejected')),
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  decided_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS payment_reversal_allocations (
  id SERIAL PRIMARY KEY,
  reversal_id INTEGER NOT NULL REFERENCES payment_reversals(id) ON DELETE RESTRICT,
  payment_allocation_id INTEGER NOT NULL REFERENCES payment_allocations(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  UNIQUE(reversal_id,payment_allocation_id)
);
CREATE TABLE IF NOT EXISTS security_deposit_transactions (
  id SERIAL PRIMARY KEY,
  lease_id INTEGER NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('received','deduction','refund')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'other' CHECK (payment_method IN ('cash','bank_transfer','cheque','card','other')),
  reference TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE security_deposit_transactions ADD COLUMN IF NOT EXISTS transaction_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE security_deposit_transactions ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'other';
ALTER TABLE security_deposit_transactions ADD COLUMN IF NOT EXISTS reference TEXT NOT NULL DEFAULT '';
ALTER TABLE security_deposit_transactions ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS deposit_deduction_requests (
  id SERIAL PRIMARY KEY,
  lease_id INTEGER NOT NULL REFERENCES leases(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval','approved','rejected')),
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  decided_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);
ALTER TABLE deposit_deduction_requests ADD COLUMN IF NOT EXISTS document_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  expense_number TEXT NOT NULL UNIQUE,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
  vendor_name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency CHAR(3) NOT NULL DEFAULT 'DZD' CHECK (currency = 'DZD'),
  expense_date DATE NOT NULL,
  due_date DATE,
  paid_at DATE,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','void')),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leases_unit_dates ON leases(unit_id,start_date,end_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_status ON invoices(due_date,status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  service_type TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id SERIAL PRIMARY KEY,
  unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL,
  reporter_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','triaged','assigned','in_progress','awaiting_approval','resolved','closed','cancelled')),
  assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES maintenance_requests(id) ON DELETE RESTRICT,
  vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  quote_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (quote_amount >= 0),
  final_cost NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (final_cost >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'DZD' CHECK (currency = 'DZD'),
  scheduled_at TIMESTAMPTZ,
  materials TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','approved','in_progress','completed','cancelled')),
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL;
CREATE TABLE IF NOT EXISTS maintenance_history (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES maintenance_requests(id) ON DELETE RESTRICT,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type,entity_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_unit_status ON maintenance_requests(unit_id,status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_status ON invoices(due_date,status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
`;

export async function runMigrations(db: Db): Promise<void> {
  // Split on semicolons — statements contain no procedure bodies.
  for (const stmt of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.exec(stmt);
  }

  // The old live schema stored prices in USD. Never silently label those
  // numbers as DZD: require an explicit legacy currency and, for USD, a rate.
  const pending = await db.query<{ n: number }>(
    'SELECT COUNT(*)::int AS n FROM listings WHERE currency IS NULL',
  );
  if (Number(pending[0]?.n ?? 0) > 0) {
    const legacyCurrency = process.env.LEGACY_LISTINGS_CURRENCY?.toUpperCase();
    if (legacyCurrency === 'DZD') {
      await db.exec("UPDATE listings SET currency = 'DZD' WHERE currency IS NULL");
    } else if (legacyCurrency === 'USD') {
      const rate = Number(process.env.LEGACY_LISTINGS_USD_TO_DZD_RATE);
      if (!Number.isFinite(rate) || rate <= 0) {
        throw new Error(
          'Legacy listing prices need LEGACY_LISTINGS_USD_TO_DZD_RATE before conversion to DZD.',
        );
      }
      await db.query(
        "UPDATE listings SET price = round(price * $1, 2), currency = 'DZD' WHERE currency IS NULL",
        [rate],
      );
    } else {
      throw new Error(
        'Set LEGACY_LISTINGS_CURRENCY to DZD or USD before migrating existing listing prices.',
      );
    }
  }
  await db.exec("UPDATE listings SET currency = 'DZD' WHERE currency IS NULL");
  await db.exec("ALTER TABLE listings ALTER COLUMN currency SET DEFAULT 'DZD'");
  await db.exec('ALTER TABLE listings ALTER COLUMN currency SET NOT NULL');

  for (const stmt of ASSET_SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.exec(stmt);
  }

  // Bridge every existing public listing into the normalized asset model as
  // one property + one unit. This is a reversible mapping; the public route IDs stay intact.
  await db.query(
    `INSERT INTO properties (code, name, type, description, address, municipality, legacy_listing_id)
     SELECT 'LEG-' || l.id, l.title, l.type, l.description, l.address, l.city, l.id
     FROM listings l
     WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.legacy_listing_id = l.id)
     ON CONFLICT (legacy_listing_id) DO NOTHING`,
  );
  await db.query(
    `INSERT INTO units (property_id, code, label, type, area_sqm, bedrooms, asking_rent,
                        occupancy_status, legacy_listing_id)
     SELECT p.id, '1', l.title, l.type, l.area_sqm, l.beds, l.price,
            CASE WHEN l.status = 'leased' THEN 'leased' ELSE 'vacant' END, l.id
     FROM listings l
     JOIN properties p ON p.legacy_listing_id = l.id
     WHERE NOT EXISTS (SELECT 1 FROM units u WHERE u.legacy_listing_id = l.id)
     ON CONFLICT (legacy_listing_id) DO NOTHING`,
  );
  await db.exec(
    `UPDATE listings SET unit_id = units.id
     FROM units WHERE units.legacy_listing_id = listings.id AND listings.unit_id IS NULL`,
  );

  for (const stmt of CRM_SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.exec(stmt);
  }
  await db.query(
    `INSERT INTO leads (enquiry_id, listing_id, unit_id, contact_name, email, phone, message, source, stage, created_at)
     SELECT e.id, e.listing_id, l.unit_id, e.name, e.email, e.phone, e.message,
       'website', CASE WHEN e.status = 'contacted' THEN 'contacted'
                       WHEN e.status = 'closed' THEN 'lost' ELSE 'new' END, e.created_at
     FROM enquiries e LEFT JOIN listings l ON l.id = e.listing_id
     WHERE NOT EXISTS (SELECT 1 FROM leads x WHERE x.enquiry_id = e.id)
     ON CONFLICT (enquiry_id) DO NOTHING`,
  );
  for (const stmt of LEASING_SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.exec(stmt);
  }
}
