import Link from 'next/link';
import { listEnquiries } from '@/lib/enquiries';
import { formatDate } from '@/lib/csv';
import{getSession}from'@/lib/session';import{canManagePropertyOperations}from'@/lib/permissions';

type Props = { searchParams: Promise<{ marked?: string }> };

export default async function AdminEnquiriesPage({ searchParams }: Props) {
  const session=await getSession();if(!canManagePropertyOperations(session?.role??''))return <div className="admin-page"><p className="empty-note">ليست لديك صلاحية عرض الاستفسارات.</p></div>;
  const params = await searchParams;
  const enquiries = await listEnquiries();
  const newCount = enquiries.filter((e) => e.status === 'new').length;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>استفسارات العملاء</h1>
          <p className="admin-sub">
            إجمالي الاستفسارات: {enquiries.length} · بانتظار الرد: {newCount}. افتح استفساراً لقراءة الرسالة والرد عبر البريد الإلكتروني.
          </p>
        </div>
        <div className="admin-actions">
          <a href="/api/admin/enquiries/export" className="btn btn-outline btn-sm">
            تنزيل CSV
          </a>
        </div>
      </div>

      {params.marked && (
        <div className="banner ok" role="status">
          تم تحديث الاستفسار.
        </div>
      )}

      {enquiries.length === 0 ? (
        <div className="panel empty-state">
          <h2>لا توجد استفسارات بعد</h2>
          <p>
            ستظهر هنا استفسارات الزوار، ويمكنك تصديرها إلى CSV في أي وقت.
          </p>
          <Link href="/properties" className="btn btn-outline">
            معاينة الموقع
          </Link>
        </div>
      ) : (
        <div className="panel table-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">تاريخ الاستلام</th>
                <th scope="col">العميل</th>
                <th scope="col">العقار</th>
                <th scope="col">الحالة</th>
                <th scope="col" className="col-actions">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => (
                <tr key={e.id} className={e.status === 'new' ? 'row-new' : undefined}>
                  <td data-label="تاريخ الاستلام">{formatDate(e.created_at)}</td>
                  <td data-label="العميل">
                    <div className="cell-visitor">
                      <Link href={`/admin/enquiries/${e.id}`} className="cell-title">
                        {e.name}
                      </Link>
                      <span className="cell-sub">
                        {e.email}
                        {e.phone ? ` · ${e.phone}` : ''}
                      </span>
                    </div>
                  </td>
                  <td data-label="العقار">
                    {e.listing_id ? (
                      <Link href={`/admin/enquiries/${e.id}`} className="cell-link">
                        {e.listing_title}
                      </Link>
                    ) : (
                      <span className="cell-sub">(إعلان محذوف)</span>
                    )}
                  </td>
                  <td data-label="الحالة">
                    <span className={`status-pill s-${e.status}`}>{e.status === 'new' ? 'جديد' : e.status === 'contacted' ? 'تم التواصل' : 'مغلق'}</span>
                  </td>
                  <td data-label="الإجراءات" className="col-actions">
                    <div className="row-actions">
                      <Link href={`/admin/enquiries/${e.id}`} className="btn btn-outline btn-xs">
                        فتح
                      </Link>
                      <a
                        className="btn btn-ghost btn-xs"
                        href={`mailto:${encodeURIComponent(e.email)}?subject=${encodeURIComponent(
                          `Your enquiry: ${e.listing_title ?? 'Atlas REIT'}`,
                        )}`}
                      >
                        البريد الإلكتروني
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
