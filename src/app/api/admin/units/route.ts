import{canManagePropertyOperations}from'@/lib/permissions';
import { NextResponse } from 'next/server';
import { getSession, originAllowed } from '@/lib/session';
import { createManagedUnit } from '@/lib/assets';
import { unitSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const session=await getSession();if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canManagePropertyOperations(session.role))return NextResponse.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});
  if (!originAllowed(req)) return NextResponse.json({ error: 'مصدر الطلب غير صالح.' }, { status: 403 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'بيانات الطلب غير صالحة.' }, { status: 400 }); }
  const parsed = unitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'بيانات الوحدة غير صالحة.' }, { status: 400 });
  try {
    const id = await createManagedUnit(parsed.data);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error && error.message.includes('unique')
      ? 'رمز الوحدة مستخدم مسبقاً ضمن هذا العقار.' : 'تعذر حفظ الوحدة. تحقق من العقار والبيانات.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
