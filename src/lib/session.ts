import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import { cookies } from 'next/headers';
import { query } from './db';

export const SESSION_COOKIE = 'atlas_session';
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export type Session = {
  userId: number;
  email: string;
  name: string;
  role: string;
  sessionVersion: number;
};

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'AUTH_SECRET is missing or too short. Set it in .env.local / Vercel env vars.',
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(user: {
  id: number;
  email: string;
  name: string;
  role: string;
  session_version?: number;
}): Promise<void> {
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role, ver: user.session_version ?? 1 })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,          // JS on the page can never read the token
    sameSite: 'lax',         // blocks cross-site form POSTs (CSRF)
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<Session | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    const userId=Number(payload.sub);
    if(!Number.isSafeInteger(userId)||userId<=0)return null;
    const rows=await query<{id:number;email:string;name:string;role:string;session_version:number;active:boolean}>(
      'SELECT id,email,name,role,session_version,active FROM users WHERE id=$1',[userId],
    );
    const user=rows[0];
    if(!user||!user.active||Number(payload.ver??1)!==Number(user.session_version))return null;
    return {userId:Number(user.id),email:user.email,name:user.name,role:user.role,sessionVersion:Number(user.session_version)};
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/**
 * Verifies the Origin header of state-changing requests against the host.
 * Combined with SameSite=Lax cookies this closes classic CSRF vectors.
 */
export function originAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false; // fail closed for cookie-authenticated state changes
  try {
    const host =
      request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    if (!host) return false;
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
