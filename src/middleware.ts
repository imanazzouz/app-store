import{NextResponse,type NextRequest}from'next/server';import{jwtVerify}from'jose/jwt/verify';
export async function middleware(req:NextRequest){const{pathname}=req.nextUrl;const secret=process.env.AUTH_SECRET;
 if(pathname.startsWith('/portal')||pathname.startsWith('/api/tenant/')){
  if(['/portal/accept-invite','/portal/forgot-password','/portal/reset-password','/portal/register'].includes(pathname))return NextResponse.next();
  const token=req.cookies.get('atlas_tenant_session')?.value;let payload:Record<string,unknown>|null=null;
  if(token&&secret){try{const verified=await jwtVerify(token,new TextEncoder().encode(secret),{audience:'atlas-tenant-portal'});if(verified.payload.kind==='tenant')payload=verified.payload as Record<string,unknown>}catch{payload=null}}
  if(pathname==='/portal/login'){if(payload)return NextResponse.redirect(new URL(payload.pcr?'/portal/change-password':'/portal',req.url));return NextResponse.next()}
  if(!payload){if(pathname.startsWith('/api/'))return NextResponse.json({error:'يلزم تسجيل دخول المستأجر.'},{status:401});const url=new URL('/portal/login',req.url);url.searchParams.set('next',pathname);return NextResponse.redirect(url)}
  if(payload.pcr===true&&pathname!=='/portal/change-password'){if(pathname.startsWith('/api/'))return NextResponse.json({error:'يجب تغيير كلمة المرور المؤقتة أولاً.'},{status:403});return NextResponse.redirect(new URL('/portal/change-password',req.url))}
  if(pathname==='/portal/change-password'&&payload.pcr!==true)return NextResponse.redirect(new URL('/portal',req.url));
  return NextResponse.next();
 }
 const token=req.cookies.get('atlas_session')?.value;let authenticated=false;if(token&&secret){try{await jwtVerify(token,new TextEncoder().encode(secret));authenticated=true}catch{authenticated=false}}
 if(pathname==='/admin/login'){if(authenticated)return NextResponse.redirect(new URL('/admin',req.url));return NextResponse.next()}
 if(!authenticated){if(pathname.startsWith('/api/'))return NextResponse.json({error:'Not authenticated.'},{status:401});const url=new URL('/admin/login',req.url);if(pathname!=='/admin')url.searchParams.set('next',pathname);return NextResponse.redirect(url)}
 return NextResponse.next()
}
export const config={matcher:['/admin/:path*','/api/admin/:path*','/portal/:path*','/api/tenant/:path*']};
