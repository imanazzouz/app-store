import{canManageRoles}from'@/lib/permissions';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getSession, originAllowed } from '@/lib/session';
import { createUserSchema } from '@/lib/validation';

/** Add a staff account (admins only). */
export async function POST(req: Request) {
  const session = await getSession();
  if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canManageRoles(session.role))return NextResponse.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});
  if (!session) {
    return NextResponse.json({ error: 'يرجى تسجيل الدخول أولاً.' }, { status: 401 });
  }

  if (!originAllowed(req)) {
    return NextResponse.json({ error: 'مصدر الطلب غير صالح.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات الطلب غير صالحة.' }, { status: 400 });
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  if(session.role==='general_manager'&&parsed.data.role==='admin')return NextResponse.json({error:'تعيين مدير أعلى متاح للمدير فقط.'},{status:403});
  const email = parsed.data.email.toLowerCase();
  const existing = await query('SELECT id FROM users WHERE lower(email) = $1', [email]);
  if (existing.length) {
    return NextResponse.json(
      { error: 'يوجد حساب بهذا البريد الإلكتروني.' },
      { status: 409 },
    );
  }

  const inserted=await query<{id:number}>(
    'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
    [parsed.data.name, email, hashPassword(parsed.data.password), parsed.data.role],
  );
  await query("INSERT INTO audit_logs(user_id,entity_type,entity_id,action) VALUES($1,'user',$2,'create')",[session.userId,String(inserted[0].id)]);
  return NextResponse.json({ ok: true });
}
