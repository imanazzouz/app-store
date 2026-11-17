import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Edge guard for the staff area: every /admin page and /api/admin endpoint
 * (except the login screen) requires a valid, signed session cookie.
 */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get('atlas_session')?.value;
  let authenticated = false;

  if (token && process.env.AUTH_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  const { pathname } = req.nextUrl;

  if (pathname === '/admin/login') {
    if (authenticated) return NextResponse.redirect(new URL('/admin', req.url));
    return NextResponse.next();
  }

  if (!authenticated) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }
    const url = new URL('/admin/login', req.url);
    if (pathname !== '/admin') url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
