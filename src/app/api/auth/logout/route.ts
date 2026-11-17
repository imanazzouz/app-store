import { NextResponse } from 'next/server';
import { destroySession, originAllowed } from '@/lib/session';

export async function POST(req: Request) {
  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }
  await destroySession();
  return NextResponse.json({ ok: true });
}
