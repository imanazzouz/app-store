import Link from 'next/link';
import { destroySession, getSession, SESSION_COOKIE } from '@/lib/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { BrandMark } from '@/components/site-header';
import AdminNav from '@/components/admin-nav';
import DemoBanner from '@/components/demo-banner';
import './admin.css';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Unauthenticated visitors only ever see the login screen (middleware
  // already redirects everything else).
  if (!session) {
    const jar=await cookies();
    if(jar.get(SESSION_COOKIE)?.value){await destroySession();redirect('/admin/login');}
    return <div className="admin-login-shell">{children}</div>;
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <Link href="/admin" className="brand admin-brand">
            <BrandMark size={30} />
            <span className="brand-name">
              ATLAS <b>REIT</b>
            </span>
            <span className="admin-badge">الإدارة</span>
          </Link>
          <AdminNav role={session.role} />
          <div className="admin-user">
            <span className="admin-user-name" title={session.email}>
              {session.name}
            </span>
            <form action="/api/auth/logout" method="post" className="logout-form">
              <button type="submit" className="btn btn-ghost btn-sm">
                تسجيل الخروج
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="admin-main">
        <DemoBanner />
        {children}
      </main>
    </div>
  );
}
