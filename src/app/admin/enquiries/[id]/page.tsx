import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEnquiry } from '@/lib/enquiries';
import { formatDate } from '@/lib/csv';
import{getSession}from'@/lib/session';import{canManagePropertyOperations}from'@/lib/permissions';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function EnquiryDetailPage({ params }: Props) {
  const session=await getSession();if(!canManagePropertyOperations(session?.role??''))return <div className="admin-page"><p className="empty-note">ليست لديك صلاحية عرض الاستفسار.</p></div>;
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const enquiry = await getEnquiry(id);
  if (!enquiry) notFound();

  return (
    <div className="admin-page narrow">
      <div className="admin-page-head">
        <div>
          <h1>استفسار من {enquiry.name}</h1>
          <p className="admin-sub">تاريخ الاستلام: {formatDate(enquiry.created_at)}</p>
        </div>
        <Link href="/admin/enquiries" className="btn btn-ghost btn-sm">
          العودة إلى الاستفسارات ←
        </Link>
      </div>

      <div className="admin-cols">
        <section className="panel detail-panel">
          <div className="panel-head">
            <h2>الرسالة</h2>
            <span className={`status-pill s-${enquiry.status}`}>{enquiry.status === 'new' ? 'جديد' : enquiry.status === 'contacted' ? 'تم التواصل' : 'مغلق'}</span>
          </div>
          <dl className="kv">
            <dt>العقار</dt>
            <dd>
              {enquiry.listing_id ? (
                <Link href={`/properties/${enquiry.listing_id}`} target="_blank">
                  {enquiry.listing_title} ↗
                </Link>
              ) : (
                '(تم حذف الإعلان)'
              )}
            </dd>
            <dt>الاسم</dt>
            <dd>{enquiry.name}</dd>
            <dt>البريد الإلكتروني</dt>
            <dd>
              <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
            </dd>
            <dt>الهاتف</dt>
            <dd>{enquiry.phone ? <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a> : '—'}</dd>
            <dt>تاريخ الاستلام</dt>
            <dd>{formatDate(enquiry.created_at)}</dd>
          </dl>

          <div className="message-body">
            {enquiry.message ? (
              <p>{enquiry.message}</p>
            ) : (
              <p className="empty-note">لم يضف العميل رسالة أخرى.</p>
            )}
          </div>

          <div className="detail-actions">
            <a
              className="btn btn-primary"
              href={`mailto:${encodeURIComponent(enquiry.email)}?subject=${encodeURIComponent(
                `Your enquiry: ${enquiry.listing_title ?? 'Atlas REIT'}`,
              )}&body=${encodeURIComponent(
                `Dear ${enquiry.name},\n\nThank you for your interest in “${enquiry.listing_title ?? 'Atlas REIT property'}”.\n\n…\n\nKind regards,\nAtlas REIT — Leasing Team`,
              )}`}
            >
              الرد على الاستفسار
            </a>
          </div>
        </section>

        <section className="panel detail-panel">
          <div className="panel-head">
            <h2>حالة المتابعة</h2>
          </div>
          <p className="panel-note">
            حدّث حالة المتابعة ليعرف أعضاء الفريق آخر المستجدات.
          </p>
          <div className="status-actions">
            {(['new', 'contacted', 'closed'] as const).map((status) => (
              <form
                key={status}
                action={`/api/admin/enquiries/${enquiry.id}/status`}
                method="post"
              >
                <input type="hidden" name="status" value={status} />
                <button
                  type="submit"
                  className={`btn btn-sm ${
                    enquiry.status === status ? 'btn-primary' : 'btn-outline'
                  }`}
                  disabled={enquiry.status === status}
                >
                  {status === 'new'
                    ? 'إعادة إلى جديد'
                    : status === 'contacted'
                      ? 'تم التواصل'
                      : 'إغلاق الاستفسار'}
                </button>
              </form>
            ))}
          </div>

          <div className="info-box">
            <h3>الخطوات التالية</h3>
            <ol>
              <li>الرد على العميل وإرسال معلومات الطلب.</li>
              <li>مراجعة المستندات عند استلامها واستكمال التوقيع.</li>
              <li>تحديث حالة الوحدة إلى <strong>مؤجرة</strong> في الإعلانات.</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
