import { isEphemeralDb } from '@/lib/db';

/**
 * Visible only on Vercel previews that have no database attached yet.
 * Disappears automatically once POSTGRES_URL (Neon) is connected.
 */
export default function DemoBanner() {
  if (!isEphemeralDb()) return null;
  return (
    <div className="demo-banner" role="status">
      <strong>Preview environment</strong> — no database is connected yet, so
      listings and enquiries are temporary. Attach Postgres (Neon) in Vercel →
      Marketplace to persist data. See <code>docs/HANDOFF.md</code>.
    </div>
  );
}
