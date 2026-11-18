import Link from 'next/link';
import { getListingCounts, getListings, getPortfolioStats } from '@/lib/listings';
import { countNewEnquiries, recentEnquiries } from '@/lib/enquiries';
import { formatDate } from '@/lib/csv';
import { typeLabels } from '@/lib/validation';
import{getSession}from'@/lib/session';import{canManagePropertyOperations,canRecordFinancial}from'@/lib/permissions';import{getLeaseNotifications}from'@/lib/lease-notifications';

export default async function AdminOverviewPage() {
  const currentSession=await getSession();
  if(!canManagePropertyOperations(currentSession?.role??''))return canRecordFinancial(currentSession?.role??'')?<div className="admin-page"><h1>لوحة المحاسب</h1><p className="admin-sub">الوصول المباشر إلى الفواتير والدفعات والمصروفات.</p><div className="admin-actions"><Link href="/admin/invoices" className="btn btn-outline">الفواتير</Link><Link href="/admin/payments" className="btn btn-outline">الدفعات</Link><Link href="/admin/expenses" className="btn btn-outline">المصروفات</Link></div></div>:<div className="admin-page"><p className="empty-note">ليست لديك صلاحية عرض هذه الصفحة.</p></div>;
  const [stats, counts, newEnquiries, recent, listings, leaseAlerts] = await Promise.all([
    getPortfolioStats(),
    getListingCounts(),
    countNewEnquiries(),
    recentEnquiries(5),
    getListings(),
    getLeaseNotifications(),
  ]);

  const recentListings = listings.slice(0, 5);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>لوحة التحكم</h1>
          <p className="admin-sub">ملخص المحفظة والاستفسارات.</p>
        </div>
        <div className="admin-actions">
          <a href="/api/admin/enquiries/export" className="btn btn-outline btn-sm">
            تنزيل الاستفسارات (CSV)
          </a>
          <Link href="/admin/listings/new" className="btn btn-primary btn-sm">
            + إعلان جديد
          </Link>
        </div>
      </div>

      {leaseAlerts.length>0&&<section className="panel"><div className="panel-head"><h2>تنبيهات انتهاء العقود</h2><Link href="/admin/leases" className="btn btn-outline btn-xs">عرض العقود</Link></div><ul className="info-list">{leaseAlerts.slice(0,8).map(a=><li key={a.id}><strong>{a.lease_number}</strong> — {a.tenant_name} · ينتهي {a.end_date} (تنبيه {a.days_before} يوماً)</li>)}</ul></section>}

      <div className="stat-grid">
        <Link href="/admin/listings" className="stat-card">
          <span className="stat-label">إجمالي الوحدات</span>
          <strong className="stat-value">{stats.units}</strong>
          <span className="stat-hint">
            {counts.commercial} تجاري · {counts.residential} سكني ·{' '}
            {counts.warehouse} مستودع
          </span>
        </Link>
        <Link href="/admin/listings" className="stat-card">
          <span className="stat-label">متاحة</span>
          <strong className="stat-value good">{stats.available}</strong>
          <span className="stat-hint">تُعرض متاحة على الموقع</span>
        </Link>
        <Link href="/admin/listings" className="stat-card">
          <span className="stat-label">مؤجرة</span>
          <strong className="stat-value">{stats.leased}</strong>
          <span className="stat-hint">{stats.occupancy}% إشغال</span>
        </Link>
        <Link href="/admin/enquiries" className="stat-card">
          <span className="stat-label">استفسارات جديدة</span>
          <strong className="stat-value gold">{newEnquiries}</strong>
          <span className="stat-hint">بانتظار الرد الأول</span>
        </Link>
      </div>

      <div className="admin-cols">
        <section className="panel">
          <div className="panel-head">
            <h2>أحدث الاستفسارات</h2>
            <Link href="/admin/enquiries" className="link-arrow">
              عرض الكل ←
            </Link>
          </div>
          {recent.length ? (
            <ul className="mini-list">
              {recent.map((e) => (
                <li key={e.id}>
                  <div className="mini-main">
                    <Link href={`/admin/enquiries/${e.id}`} className="mini-title">
                      {e.name}
                    </Link>
                    <span className="mini-sub">
                      {e.listing_title ?? '(إعلان محذوف)'} · {formatDate(e.created_at)}
                    </span>
                  </div>
                  <span className={`status-pill s-${e.status}`}>{e.status === 'new' ? 'جديد' : e.status === 'contacted' ? 'تم التواصل' : 'مغلق'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">لا توجد استفسارات بعد.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>أحدث الإعلانات</h2>
            <Link href="/admin/listings" className="link-arrow">
              إدارة الإعلانات ←
            </Link>
          </div>
          {recentListings.length ? (
            <ul className="mini-list">
              {recentListings.map((l) => (
                <li key={l.id}>
                  <div className="mini-main">
                    <Link href={`/admin/listings/${l.id}/edit`} className="mini-title">
                      {l.title}
                    </Link>
                    <span className="mini-sub">
                      {typeLabels[l.type]} · {l.city}
                    </span>
                  </div>
                  <span className={`status-pill s-${l.status}`}>{l.status === 'leased' ? 'مؤجرة' : 'متاحة'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">لا توجد إعلانات بعد — أضف أول إعلان.</p>
          )}
        </section>
      </div>
    </div>
  );
}
