import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'atlas_session';
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export type Session = {
  userId: number;
  email: string;
  name: string;
  role: string;
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
}): Promise<void> {
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role })
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
    return {
      userId: Number(payload.sub),
      email: String(payload.email ?? ''),
      name: String(payload.name ?? ''),
      role: String(payload.role ?? 'editor'),
    };
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
  if (!origin) return true; // same-origin form GETs / non-browser clients
  try {
    const host =
      request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    if (!host) return false;
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
