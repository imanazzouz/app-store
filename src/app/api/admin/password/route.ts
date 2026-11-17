import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { getSession, originAllowed } from '@/lib/session';
import { passwordChangeSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const rows = await query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [session.userId],
  );
  if (!rows.length || !verifyPassword(parsed.data.current, rows[0].password_hash)) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [
    hashPassword(parsed.data.next),
    session.userId,
  ]);
  return NextResponse.json({ ok: true });
}
