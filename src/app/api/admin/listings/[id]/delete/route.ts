import{canManagePropertyOperations}from'@/lib/permissions';
import { NextResponse } from 'next/server';
import { getSession, originAllowed } from '@/lib/session';
import { deleteListing } from '@/lib/listings';

/** Form-friendly delete (works without JavaScript). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session=await getSession();
  if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canManagePropertyOperations(session.role))return NextResponse.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid listing id.' }, { status: 400 });
  }

  await deleteListing(id);

  const back = req.headers.get('referer') || '/admin/listings';
  return NextResponse.redirect(new URL(back, req.url), 303);
}
