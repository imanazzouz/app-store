import { NextResponse } from 'next/server';
import { getSession, originAllowed } from '@/lib/session';
import { setListingStatus } from '@/lib/listings';

/**
 * Form-friendly status toggle (works without JavaScript):
 * POST { status: 'available' | 'leased' } then redirects back.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid listing id.' }, { status: 400 });
  }

  let status: unknown;
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      const body = (await req.json()) as Record<string, unknown>;
      status = body.status;
    } catch {
      /* fall through */
    }
  } else {
    try {
      const form = await req.formData();
      status = form.get('status');
    } catch {
      /* fall through */
    }
  }

  if (status !== 'available' && status !== 'leased') {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  await setListingStatus(id, status);

  if (contentType.includes('application/json')) {
    return NextResponse.json({ ok: true });
  }
  const back = req.headers.get('referer') || '/admin/listings';
  return NextResponse.redirect(new URL(back, req.url), 303);
}
