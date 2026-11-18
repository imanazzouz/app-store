import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { createSession, getSession, originAllowed } from '@/lib/session';
import { passwordChangeSchema } from '@/lib/validation';

export async function POST(req: Request) {
  const session = await getSession();
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

  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const rows = await query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [session.userId],
  );
  if (!rows.length || !verifyPassword(parsed.data.current, rows[0].password_hash)) {
    return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة.' }, { status: 401 });
  }

  const updated=await query<{id:number;email:string;name:string;role:string;session_version:number}>(
    'UPDATE users SET password_hash=$1,session_version=session_version+1 WHERE id=$2 AND active=true RETURNING id,email,name,role,session_version',
    [hashPassword(parsed.data.next),session.userId],
  );
  if(!updated.length)return NextResponse.json({error:'الحساب غير نشط.'},{status:401});
  await createSession(updated[0]);
  return NextResponse.json({ ok: true });
}
