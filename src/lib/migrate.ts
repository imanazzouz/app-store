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
  role          TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin','editor')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listings (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('commercial','residential','warehouse')),
  status      TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','leased')),
  price       NUMERIC(12,2) NOT NULL,
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

export async function runMigrations(db: Db): Promise<void> {
  // Split on semicolons — statements contain no procedure bodies.
  for (const stmt of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) {
    await db.exec(stmt);
  }
}
