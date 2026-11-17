import Link from 'next/link';
import { listEnquiries } from '@/lib/enquiries';
import { formatDate } from '@/lib/csv';

type Props = { searchParams: Promise<{ marked?: string }> };

export default async function AdminEnquiriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const enquiries = await listEnquiries();
  const newCount = enquiries.filter((e) => e.status === 'new').length;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Enquiries</h1>
          <p className="admin-sub">
            {enquiries.length} total · {newCount} awaiting first reply. Open one
            to see the full message and reply by email.
          </p>
        </div>
        <div className="admin-actions">
          <a href="/api/admin/enquiries/export" className="btn btn-outline btn-sm">
            Download CSV
          </a>
        </div>
      </div>

      {params.marked && (
        <div className="banner ok" role="status">
          Enquiry updated.
        </div>
      )}

      {enquiries.length === 0 ? (
        <div className="panel empty-state">
          <h2>No enquiries yet</h2>
          <p>
            When a visitor submits the form on a unit page, it appears here —
            and you can export everything to CSV at any time.
          </p>
          <Link href="/properties" className="btn btn-outline">
            Preview the public site
          </Link>
        </div>
      ) : (
        <div className="panel table-panel">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Received</th>
                <th scope="col">Visitor</th>
                <th scope="col">Property</th>
                <th scope="col">Status</th>
                <th scope="col" className="col-actions">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => (
                <tr key={e.id} className={e.status === 'new' ? 'row-new' : undefined}>
                  <td data-label="Received">{formatDate(e.created_at)}</td>
                  <td data-label="Visitor">
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
                  <td data-label="Property">
                    {e.listing_id ? (
                      <Link href={`/admin/enquiries/${e.id}`} className="cell-link">
                        {e.listing_title}
                      </Link>
                    ) : (
                      <span className="cell-sub">(removed listing)</span>
                    )}
                  </td>
                  <td data-label="Status">
                    <span className={`status-pill s-${e.status}`}>{e.status}</span>
                  </td>
                  <td data-label="Actions" className="col-actions">
                    <div className="row-actions">
                      <Link href={`/admin/enquiries/${e.id}`} className="btn btn-outline btn-xs">
                        Open
                      </Link>
                      <a
                        className="btn btn-ghost btn-xs"
                        href={`mailto:${encodeURIComponent(e.email)}?subject=${encodeURIComponent(
                          `Your enquiry: ${e.listing_title ?? 'Atlas REIT'}`,
                        )}`}
                      >
                        Email
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
