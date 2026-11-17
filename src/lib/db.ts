import fs from 'node:fs/promises';
import path from 'node:path';
import { runMigrations } from './migrate';
import { runSeed } from './seed';

/**
 * Tiny data-access layer with two interchangeable PostgreSQL drivers:
 *
 *  - Production (Vercel): any managed Postgres — set POSTGRES_URL
 *    (Vercel Marketplace → Neon attaches it automatically).
 *  - Local development: an embedded Postgres (PGlite) stored in ./.data/pglite,
 *    so `npm run dev` works with zero external services.
 *
 * The SQL dialect is identical in both cases — nothing else changes.
 */

export type Row = Record<string, unknown>;

export interface Db {
  /** Run a parameterised query ($1, $2, …) and return the rows. */
  query<T = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Run a statement without returning rows. */
  exec(sql: string): Promise<void>;
}

const g = globalThis as unknown as { __atlasDbPromise?: Promise<Db> };

async function createDriver(): Promise<Db> {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (url) {
    // ── Managed Postgres (Neon, Vercel Postgres, RDS, …) ──────────────
    const { Pool } = await import('pg');
    const isLocal = /localhost|127\.0\.0\.1/.test(url);
    const pool = new Pool({
      connectionString: url,
      max: 5,
      connectionTimeoutMillis: 10_000,
      ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
    });
    return {
      async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        const res = await pool.query(sql, params);
        return res.rows as T[];
      },
      async exec(sql: string): Promise<void> {
        await pool.query(sql);
      },
    };
  }

  // ── Embedded Postgres (development, or Vercel preview before a
  //    database is attached — /tmp is the only writable directory there).
  //    Data in preview mode is temporary: attaching Neon (POSTGRES_URL)
  //    switches the app to persistent storage with zero code changes.
  const { PGlite } = await import('@electric-sql/pglite');
  const dataDir =
    process.env.PGLITE_DIR ||
    (process.env.VERCEL
      ? '/tmp/atlas-pglite'
      : path.join(process.cwd(), '.data', 'pglite'));
  await fs.mkdir(dataDir, { recursive: true });
  const pg = new PGlite(dataDir);
  await pg.waitReady;
  return {
    async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      const res = await pg.query(sql, params);
      return res.rows as T[];
    },
    async exec(sql: string): Promise<void> {
      await pg.query(sql);
    },
  };
}

/**
 * Returns the shared database handle, running schema migrations and the
 * first-run seed exactly once per process (safe under concurrent requests).
 */
export async function getDb(): Promise<Db> {
  if (!g.__atlasDbPromise) {
    g.__atlasDbPromise = (async () => {
      const db = await createDriver();
      await runMigrations(db);
      await runSeed(db);
      return db;
    })();
    // Never cache a failure — clear it so the next request retries cleanly.
    g.__atlasDbPromise.catch(() => {
      g.__atlasDbPromise = undefined;
    });
  }
  return g.__atlasDbPromise;
}

/**
 * True when running on Vercel without an attached database — the app then
 * falls back to ephemeral storage and the UI shows a visible notice so nobody
 * mistakes it for a production data store.
 */
export function isEphemeralDb(): boolean {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  return Boolean(process.env.VERCEL) && !url;
}

/** Convenience wrapper: `const rows = await query<Listing>(...)`. */
export async function query<T = Row>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const db = await getDb();
  return db.query<T>(sql, params);
}
