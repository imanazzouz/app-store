import{canManagePropertyOperations}from'@/lib/permissions';
import { NextResponse } from 'next/server';
import { getSession, originAllowed } from '@/lib/session';
import { setEnquiryStatus } from '@/lib/enquiries';

const VALID = ['new', 'contacted', 'closed'] as const;

/** Form-friendly status update (works without JavaScript). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session=await getSession();
  if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canManagePropertyOperations(session.role))return NextResponse.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});
  if (!session) {
    return NextResponse.json({ error: 'يرجى تسجيل الدخول أولاً.' }, { status: 401 });
  }
  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'مصدر الطلب غير صالح.' }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'معرّف الاستفسار غير صالح.' }, { status: 400 });
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

  if (!(VALID as readonly string[]).includes(String(status))) {
    return NextResponse.json({ error: 'الحالة غير صالحة.' }, { status: 400 });
  }

  await setEnquiryStatus(id, status as (typeof VALID)[number]);

  if (contentType.includes('application/json')) {
    return NextResponse.json({ ok: true });
  }
  const back = req.headers.get('referer') || '/admin/enquiries';
  return NextResponse.redirect(new URL(back, req.url), 303);
}
