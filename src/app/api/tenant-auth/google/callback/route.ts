import{createRemoteJWKSet,jwtVerify}from'jose';
import{NextRequest,NextResponse}from'next/server';
import{withTransaction}from'@/lib/db';
import{createTenantSession}from'@/lib/tenant-session';
import{verifyGoogleOAuthState}from'@/lib/google-oauth-state';
const COOKIE='atlas_google_oauth';
const GOOGLE_KEYS=createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
function callbackUrl(){const value=process.env.APP_BASE_URL;if(!value)throw new Error('APP_BASE_URL is required.');const base=new URL(value);if(process.env.NODE_ENV==='production'&&base.protocol!=='https:')throw new Error('APP_BASE_URL must use HTTPS in production.');return`${base.origin}/api/tenant-auth/google/callback`}
function redirect(req:NextRequest,path:string){let base=req.nextUrl.origin;try{if(process.env.APP_BASE_URL)base=new URL(process.env.APP_BASE_URL).origin}catch{}const response=NextResponse.redirect(new URL(path,base));response.cookies.set(COOKIE,'',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/api/tenant-auth/google',maxAge:0});return response}
export async function GET(req:NextRequest){
 const checked=verifyGoogleOAuthState(req.cookies.get(COOKIE)?.value,req.nextUrl.searchParams.get('state')??undefined);
 if(!checked||req.nextUrl.searchParams.has('error'))return redirect(req,'/portal/login?google=failed');
 const code=req.nextUrl.searchParams.get('code');const clientId=process.env.GOOGLE_CLIENT_ID;const clientSecret=process.env.GOOGLE_CLIENT_SECRET;
 if(!code||!clientId||!clientSecret)return redirect(req,'/portal/login?google=failed');
 try{
  const tokenResponse=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:clientId,client_secret:clientSecret,redirect_uri:callbackUrl(),code_verifier:checked.codeVerifier,grant_type:'authorization_code'}),signal:AbortSignal.timeout(10000)});
  if(!tokenResponse.ok)return redirect(req,'/portal/login?google=failed');
  const tokens=await tokenResponse.json() as {id_token?:string};if(!tokens.id_token)return redirect(req,'/portal/login?google=failed');
  const{payload}=await jwtVerify(tokens.id_token,GOOGLE_KEYS,{issuer:['https://accounts.google.com','accounts.google.com'],audience:clientId});
  if(payload.nonce!==checked.nonce||payload.email_verified!==true||typeof payload.email!=='string'||typeof payload.sub!=='string')return redirect(req,'/portal/login?google=failed');
  const email=payload.email.trim().toLowerCase();const subject=payload.sub;if(!email||email.length>200||!subject||subject.length>255)return redirect(req,'/portal/login?google=failed');
  const googleName=typeof payload.name==='string'&&payload.name.trim()?payload.name.trim().slice(0,160):email;
  const tenant=await withTransaction(async tx=>{
   const fields='id,email,legal_name,portal_session_version,portal_active,portal_password_hash,password_change_required,google_subject';
   const bySubject=await tx.query<{id:number;email:string;legal_name:string;portal_session_version:number;portal_active:boolean;portal_password_hash:string|null;password_change_required:boolean;google_subject:string|null}>(`SELECT ${fields} FROM tenants WHERE google_subject=$1 FOR UPDATE`,[subject]);
   if(bySubject.length>1)return null;
   let t=bySubject[0];let action='google_login';
   if(!t){const matches=await tx.query<{id:number;email:string;legal_name:string;portal_session_version:number;portal_active:boolean;portal_password_hash:string|null;password_change_required:boolean;google_subject:string|null}>(`SELECT ${fields} FROM tenants WHERE lower(email)=$1 ORDER BY id FOR UPDATE`,[email]);if(matches.length>1)return null;t=matches[0]}
   if(t){if(t.google_subject&&t.google_subject!==subject)return null;if(!t.portal_active&&(t.portal_password_hash||t.password_change_required))return null;if(!t.portal_active)action='google_portal_activation';const bump=!t.portal_active||t.password_change_required;await tx.query('UPDATE tenants SET google_subject=$1,portal_active=true,password_change_required=false,portal_email_verified_at=now(),portal_session_version=portal_session_version+CASE WHEN portal_active=false OR password_change_required THEN 1 ELSE 0 END,updated_at=now() WHERE id=$2',[subject,t.id]);t={...t,google_subject:subject,portal_session_version:Number(t.portal_session_version)+(bump?1:0)}}
   else{action='google_self_registration';const inserted=await tx.query<{id:number;email:string;legal_name:string;portal_session_version:number}>('INSERT INTO tenants(legal_name,email,portal_active,portal_email_verified_at,google_subject) VALUES($1,$2,true,now(),$3) RETURNING id,email,legal_name,portal_session_version',[googleName,email,subject]);t={...inserted[0],portal_active:true,portal_password_hash:null,password_change_required:false,google_subject:subject}}
   await tx.query("INSERT INTO audit_logs(entity_type,entity_id,action) VALUES('tenant_portal',$1,$2)",[String(t.id),action]);return{id:Number(t.id),email:t.email,name:t.legal_name,portal_session_version:Number(t.portal_session_version),password_change_required:false}
  });
  if(!tenant)return redirect(req,'/portal/login?google=failed');
  await createTenantSession(tenant);return redirect(req,'/portal');
 }catch{return redirect(req,'/portal/login?google=failed')}
}
