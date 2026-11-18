import{canRequestLease}from'@/lib/permissions';
import { NextResponse } from 'next/server';
import { getSession, originAllowed } from '@/lib/session';
import { tenantSchema } from '@/lib/validation';
import { createTenant } from '@/lib/leasing';
export async function POST(req:Request){const session=await getSession();if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canRequestLease(session.role))return NextResponse.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!originAllowed(req))return NextResponse.json({error:'مصدر الطلب غير صالح.'},{status:403});let body:unknown;try{body=await req.json()}catch{return NextResponse.json({error:'بيانات الطلب غير صالحة.'},{status:400})}const p=tenantSchema.safeParse(body);if(!p.success)return NextResponse.json({error:p.error.issues[0]?.message??'بيانات المستأجر غير صالحة.'},{status:400});try{return NextResponse.json({ok:true,id:await createTenant(p.data)})}catch{return NextResponse.json({error:'تعذر حفظ المستأجر.'},{status:400})}}
