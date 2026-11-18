import{canManagePropertyOperations}from'@/lib/permissions';
import { NextResponse } from 'next/server';
import { getSession, originAllowed } from '@/lib/session';
import { updateLeadStage } from '@/lib/crm';
import { leadStageSchema } from '@/lib/validation';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canManagePropertyOperations(session.role))return NextResponse.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});
  if (!session) return NextResponse.json({ error: 'يرجى تسجيل الدخول أولاً.' }, { status: 401 });
  if (!originAllowed(req)) return NextResponse.json({ error: 'مصدر الطلب غير صالح.' }, { status: 403 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'معرّف العميل غير صالح.' }, { status: 400 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'بيانات الطلب غير صالحة.' }, { status: 400 }); }
  const parsed = leadStageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'مرحلة العميل غير صالحة.' }, { status: 400 });
  const found = await updateLeadStage(id, parsed.data.stage, session.userId, parsed.data.note);
  return found ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'ملف العميل غير موجود.' }, { status: 404 });
}
