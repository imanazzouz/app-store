import{canManagePropertyOperations}from'@/lib/permissions';
import { NextResponse } from 'next/server';
import { getSession, originAllowed } from '@/lib/session';
import { createVisit } from '@/lib/crm';
import { visitSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const session = await getSession();
  if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canManagePropertyOperations(session.role))return NextResponse.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});
  if (!session) return NextResponse.json({ error: 'يرجى تسجيل الدخول أولاً.' }, { status: 401 });
  if (!originAllowed(req)) return NextResponse.json({ error: 'مصدر الطلب غير صالح.' }, { status: 403 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'بيانات الطلب غير صالحة.' }, { status: 400 }); }
  const parsed = visitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'بيانات الزيارة غير صالحة.' }, { status: 400 });
  if (new Date(parsed.data.scheduled_at).getTime() <= Date.now()) return NextResponse.json({ error: 'يجب أن يكون موعد الزيارة في المستقبل.' }, { status: 400 });
  try { return NextResponse.json({ ok: true, id: await createVisit(parsed.data, session.userId) }); }
  catch (error) {
    const conflict = error instanceof Error && (error.message.includes('idx_visits_unit_slot') || error.message.includes('idx_visits_staff_slot') || error.message.includes('duplicate key'));
    return NextResponse.json({ error: conflict ? 'يوجد تعارض في موعد الوحدة أو الموظف.' : 'تعذر حفظ موعد الزيارة.' }, { status: conflict ? 409 : 400 });
  }
}
