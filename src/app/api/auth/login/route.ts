import {createHash}from'node:crypto';
import{NextResponse}from'next/server';
import{query,withTransaction}from'@/lib/db';
import{hashPassword,verifyPassword}from'@/lib/auth';
import{createSession,originAllowed}from'@/lib/session';
import{loginSchema}from'@/lib/validation';
const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const DUMMY_HASH=hashPassword('Non-user-Dummy-Password-Hash-Value-2026!');
const LOCK_MINUTES=10;const MAX_FAILURES=6;
async function locked(keys:string[]){if(!keys.length)return false;const rows=await query<{locked:boolean}>(`SELECT EXISTS(SELECT 1 FROM auth_login_attempts WHERE identifier_hash=ANY($1::text[]) AND locked_until>now()) AS locked`,[keys]);return Boolean(rows[0]?.locked)}
async function recordFailure(keys:string[]){await withTransaction(async tx=>{for(const key of keys)await tx.query(`INSERT INTO auth_login_attempts(identifier_hash,failed_attempts,locked_until,updated_at) VALUES($1,1,NULL,now()) ON CONFLICT(identifier_hash) DO UPDATE SET failed_attempts=CASE WHEN auth_login_attempts.locked_until>now() THEN auth_login_attempts.failed_attempts ELSE auth_login_attempts.failed_attempts+1 END,locked_until=CASE WHEN auth_login_attempts.locked_until>now() THEN auth_login_attempts.locked_until WHEN auth_login_attempts.failed_attempts+1 >= $2 THEN now()+($3 * interval '1 minute') ELSE NULL END,updated_at=now()`,[key,MAX_FAILURES,LOCK_MINUTES])})}
export async function POST(req:Request){
  if(!originAllowed(req))return NextResponse.json({error:'مصدر الطلب غير صالح.'},{status:403});
  let body:unknown;try{body=await req.json()}catch{return NextResponse.json({error:'بيانات الطلب غير صالحة.'},{status:400})}
  const parsed=loginSchema.safeParse(body);if(!parsed.success)return NextResponse.json({error:'تحقق من البريد الإلكتروني وكلمة المرور.'},{status:400});
  const email=parsed.data.email.toLowerCase();const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('x-real-ip')||'unknown';
  const accountKey=sha(`account:${email}`);const ipKey=sha(`ip:${ip}`);const keys=[accountKey,ipKey];
  if(await locked(keys))return NextResponse.json({error:'تعذر تسجيل الدخول حالياً. انتظر عشر دقائق ثم حاول مجدداً.'},{status:429});
  const rows=await query<{id:number;name:string;email:string;password_hash:string;role:string;active:boolean;session_version:number}>('SELECT id,name,email,password_hash,role,active,session_version FROM users WHERE lower(email)=$1',[email]);
  const user=rows[0];const passwordValid=verifyPassword(parsed.data.password,user?.password_hash??DUMMY_HASH);
  if(!user||!passwordValid||!user.active){await recordFailure(keys);return NextResponse.json({error:'البريد الإلكتروني أو كلمة المرور غير صحيحة.'},{status:401})}
  await withTransaction(async tx=>{
    await tx.query('DELETE FROM auth_login_attempts WHERE identifier_hash=ANY($1::text[])',[keys]);
    await tx.query('UPDATE users SET last_login_at=now() WHERE id=$1',[user.id]);
    await tx.query("INSERT INTO audit_logs(user_id,entity_type,entity_id,action) VALUES($1,'authentication',$2,'login_success')",[user.id,String(user.id)]);
  });
  await createSession(user);
  return NextResponse.json({ok:true});
}
