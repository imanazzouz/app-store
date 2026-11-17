import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEnquiry } from '@/lib/enquiries';
import { formatDate } from '@/lib/csv';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function EnquiryDetailPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const enquiry = await getEnquiry(id);
  if (!enquiry) notFound();

  return (
    <div className="admin-page narrow">
      <div className="admin-page-head">
        <div>
          <h1>Enquiry from {enquiry.name}</h1>
          <p className="admin-sub">Received {formatDate(enquiry.created_at)}</p>
        </div>
        <Link href="/admin/enquiries" className="btn btn-ghost btn-sm">
          ← Back to enquiries
        </Link>
      </div>

      <div className="admin-cols">
        <section className="panel detail-panel">
          <div className="panel-head">
            <h2>Message</h2>
            <span className={`status-pill s-${enquiry.status}`}>{enquiry.status}</span>
          </div>
          <dl className="kv">
            <dt>Property</dt>
            <dd>
              {enquiry.listing_id ? (
                <Link href={`/properties/${enquiry.listing_id}`} target="_blank">
                  {enquiry.listing_title} ↗
                </Link>
              ) : (
                '(listing was removed)'
              )}
            </dd>
            <dt>Name</dt>
            <dd>{enquiry.name}</dd>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
            </dd>
            <dt>Phone</dt>
            <dd>{enquiry.phone ? <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a> : '—'}</dd>
            <dt>Received</dt>
            <dd>{formatDate(enquiry.created_at)}</dd>
          </dl>

          <div className="message-body">
            {enquiry.message ? (
              <p>{enquiry.message}</p>
            ) : (
              <p className="empty-note">No extra message was written.</p>
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
              Reply with application pack
            </a>
          </div>
        </section>

        <section className="panel detail-panel">
          <div className="panel-head">
            <h2>Follow-up status</h2>
          </div>
          <p className="panel-note">
            Mark your progress so colleagues know where this enquiry stands.
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
                    ? 'Mark as new'
                    : status === 'contacted'
                      ? 'Mark contacted'
                      : 'Close enquiry'}
                </button>
              </form>
            ))}
          </div>

          <div className="info-box">
            <h3>What happens next</h3>
            <ol>
              <li>Reply to the visitor with the full application pack.</li>
              <li>Once they submit documents offline, review and sign.</li>
              <li>Flip the unit to <strong>Leased</strong> in Listings.</li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
