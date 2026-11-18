import{canRecordFinancial}from'@/lib/permissions';
import { NextResponse } from 'next/server';
import { getSession, originAllowed } from '@/lib/session';
import { paymentSchema } from '@/lib/validation';
import { createPayment } from '@/lib/finance';
export async function POST(req:Request){const session=await getSession();if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!canRecordFinancial(session.role))return NextResponse.json({error:'ليست لديك صلاحية تنفيذ هذه العملية.'},{status:403});if(!session)return NextResponse.json({error:'يرجى تسجيل الدخول أولاً.'},{status:401});if(!originAllowed(req))return NextResponse.json({error:'مصدر الطلب غير صالح.'},{status:403});let body:unknown;try{body=await req.json()}catch{return NextResponse.json({error:'بيانات الطلب غير صالحة.'},{status:400})}const p=paymentSchema.safeParse(body);if(!p.success)return NextResponse.json({error:p.error.issues[0]?.message??'بيانات الدفعة غير صالحة.'},{status:400});try{return NextResponse.json({ok:true,id:await createPayment(p.data,session.userId)})}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'تعذر تسجيل الدفعة.'},{status:400})}}
