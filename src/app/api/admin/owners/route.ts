import{canManagePropertyOperations}from'@/lib/permissions';
import { NextResponse } from 'next/server';
import { getSession, originAllowed } from '@/lib/session';
import { createOwner } from '@/lib/assets';
import { ownerSchema } from '@/lib/validation';
export async function POST(req: Request) {
  const session=await getSession();if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canManagePropertyOperations(session.role))return NextResponse.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});
  if (!originAllowed(req)) return NextResponse.json({error:'مصدر الطلب غير صالح.'},{status:403});
  let body:unknown; try { body=await req.json(); } catch { return NextResponse.json({error:'بيانات الطلب غير صالحة.'},{status:400}); }
  const parsed=ownerSchema.safeParse(body); if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message??'بيانات المالك غير صالحة.'},{status:400});
  try{return NextResponse.json({ok:true,id:await createOwner(parsed.data)});}catch{return NextResponse.json({error:'تعذر حفظ المالك.'},{status:400});}
}
