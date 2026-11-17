import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { createSession, originAllowed } from '@/lib/session';
import { loginSchema } from '@/lib/validation';

/**
 * Best-effort brute-force damping, per serverless instance:
 * after 5 failed attempts the IP is locked out for 60 seconds.
 * (A shared rate-limiter / WAF rule can be layered on top at any time.)
 */
const attempts = new Map<string, { fails: number; lockedUntil: number }>();

export async function POST(req: Request) {
  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const state = attempts.get(ip) ?? { fails: 0, lockedUntil: 0 };
  if (state.lockedUntil > Date.now()) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a minute and try again.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const rows = await query<{
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: string;
  }>('SELECT id, name, email, password_hash, role FROM users WHERE lower(email) = $1', [
    parsed.data.email.toLowerCase(),
  ]);

  const user = rows[0];
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    state.fails += 1;
    if (state.fails >= 5) {
      state.lockedUntil = Date.now() + 60_000;
      state.fails = 0;
    }
    attempts.set(ip, state);
    return NextResponse.json(
      { error: 'Incorrect email or password.' },
      { status: 401 },
    );
  }

  attempts.delete(ip);
  await createSession(user);
  return NextResponse.json({ ok: true });
}
