import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getSession, originAllowed } from '@/lib/session';
import { createUserSchema } from '@/lib/validation';

/** Add a staff account (admins only). */
export async function POST(req: Request) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await query('SELECT id FROM users WHERE lower(email) = $1', [email]);
  if (existing.length) {
    return NextResponse.json(
      { error: 'An account with this email already exists.' },
      { status: 409 },
    );
  }

  await query(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
    [parsed.data.name, email, hashPassword(parsed.data.password), parsed.data.role],
  );
  return NextResponse.json({ ok: true });
}
