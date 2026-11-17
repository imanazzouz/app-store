import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, originAllowed } from '@/lib/session';

/** Remove a staff account (admins only; never removes yourself). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  if (session.role !== 'admin') {
    return NextResponse.json(
      { error: 'Only administrators can manage accounts.' },
      { status: 403 },
    );
  }
  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid user id.' }, { status: 400 });
  }
  if (id === session.userId) {
    return NextResponse.json(
      { error: 'You cannot remove your own account.' },
      { status: 400 },
    );
  }

  const admins = await query<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM users WHERE role = 'admin'",
  );
  const target = await query<{ role: string }>('SELECT role FROM users WHERE id = $1', [id]);
  if (!target.length) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }
  if (target[0].role === 'admin' && Number(admins[0].n) <= 1) {
    return NextResponse.json(
      { error: 'This is the last administrator — create another admin first.' },
      { status: 400 },
    );
  }

  await query('DELETE FROM users WHERE id = $1', [id]);
  return NextResponse.json({ ok: true });
}
