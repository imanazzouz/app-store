import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createEnquiry } from '@/lib/enquiries';
import { enquirySchema } from '@/lib/validation';
import { originAllowed } from '@/lib/session';

/** Per-instance throttle: max 8 submissions / minute / IP. */
const hits = new Map<string, { n: number; reset: number }>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + 60_000 });
    return false;
  }
  h.n += 1;
  return h.n > 8;
}

/**
 * Public enquiry endpoint — no login required, no file uploads.
 * The enquiry is stored in the database and appears in the staff dashboard.
 */
export async function POST(req: Request) {
  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (throttled(ip)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again shortly.' },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Honeypot: bots fill the hidden "company" field — pretend success, store nothing.
  if (typeof body.company === 'string' && body.company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const listings = await query<{ id: number; status: string }>(
    'SELECT id, status FROM listings WHERE id = $1',
    [parsed.data.listingId],
  );
  if (!listings.length) {
    return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
  }
  if (listings[0].status === 'leased') {
    return NextResponse.json(
      { error: 'This unit has just been leased. Browse our other available units.' },
      { status: 409 },
    );
  }

  const id = await createEnquiry(parsed.data);
  return NextResponse.json({ ok: true, id });
}
