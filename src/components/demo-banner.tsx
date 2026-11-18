import { isEphemeralDb } from '@/lib/db';

/**
 * Visible only on Vercel previews that have no database attached yet.
 * Disappears automatically once POSTGRES_URL (Neon) is connected.
 */
export default function DemoBanner() {
  if (!isEphemeralDb()) return null;
  return (
    <div className="demo-banner" role="status">
      <strong>بيئة تجريبية</strong> — لا توجد قاعدة بيانات متصلة، لذلك
      الإعلانات والاستفسارات مؤقتة. اربط قاعدة PostgreSQL من لوحة Vercel لحفظ البيانات. راجع <code>docs/HANDOFF.md</code>.
    </div>
  );
}
