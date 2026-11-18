import{canManagePropertyOperations}from'@/lib/permissions';
import { NextResponse } from 'next/server';
import { getSession, originAllowed } from '@/lib/session';
import { createManagedProperty } from '@/lib/assets';
import { propertySchema } from '@/lib/validation';

export async function POST(req: Request) {
  const session=await getSession();if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canManagePropertyOperations(session.role))return NextResponse.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});
  if (!originAllowed(req)) return NextResponse.json({ error: 'مصدر الطلب غير صالح.' }, { status: 403 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'بيانات الطلب غير صالحة.' }, { status: 400 }); }
  const parsed = propertySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'بيانات العقار غير صالحة.' }, { status: 400 });
  try {
    const id = await createManagedProperty(parsed.data);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error && error.message.includes('unique')
      ? 'رمز العقار مستخدم مسبقاً.' : 'تعذر حفظ العقار. تحقق من المالك والمحفظة والبيانات.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
