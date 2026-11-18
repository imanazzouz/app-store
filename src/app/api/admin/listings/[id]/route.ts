import{canManagePropertyOperations}from'@/lib/permissions';
import { NextResponse } from 'next/server';
import { getSession, originAllowed } from '@/lib/session';
import { deleteListing, getListing, updateListing } from '@/lib/listings';
import { listingSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

async function guard(req: Request): Promise<NextResponse | null> {
  const session=await getSession();
  if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canManagePropertyOperations(session.role))return NextResponse.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});
  if (!session) {
    return NextResponse.json({ error: 'يرجى تسجيل الدخول أولاً.' }, { status: 401 });
  }
  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'مصدر الطلب غير صالح.' }, { status: 403 });
  }
  return null;
}

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await guard(req);
  if (denied) return denied;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'معرّف الإعلان غير صالح.' }, { status: 400 });
  }
  if (!(await getListing(id))) {
    return NextResponse.json({ error: 'الإعلان غير موجود.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات الطلب غير صالحة.' }, { status: 400 });
  }

  const parsed = listingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  await updateListing(id, parsed.data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await guard(req);
  if (denied) return denied;

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'معرّف الإعلان غير صالح.' }, { status: 400 });
  }
  await deleteListing(id);
  return NextResponse.json({ ok: true });
}
