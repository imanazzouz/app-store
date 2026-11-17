import Link from 'next/link';
import { getListingCounts, getListings, getPortfolioStats } from '@/lib/listings';
import { countNewEnquiries, recentEnquiries } from '@/lib/enquiries';
import { formatDate } from '@/lib/csv';
import { typeLabels } from '@/lib/validation';

export default async function AdminOverviewPage() {
  const [stats, counts, newEnquiries, recent, listings] = await Promise.all([
    getPortfolioStats(),
    getListingCounts(),
    countNewEnquiries(),
    recentEnquiries(5),
    getListings(),
  ]);

  const recentListings = listings.slice(0, 5);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Overview</h1>
          <p className="admin-sub">Portfolio and inbox at a glance.</p>
        </div>
        <div className="admin-actions">
          <a href="/api/admin/enquiries/export" className="btn btn-outline btn-sm">
            Download enquiries (CSV)
          </a>
          <Link href="/admin/listings/new" className="btn btn-primary btn-sm">
            + New listing
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <Link href="/admin/listings" className="stat-card">
          <span className="stat-label">Total units</span>
          <strong className="stat-value">{stats.units}</strong>
          <span className="stat-hint">
            {counts.commercial} commercial · {counts.residential} residential ·{' '}
            {counts.warehouse} warehouse
          </span>
        </Link>
        <Link href="/admin/listings" className="stat-card">
          <span className="stat-label">Available</span>
          <strong className="stat-value good">{stats.available}</strong>
          <span className="stat-hint">shown as “Available now” on the site</span>
        </Link>
        <Link href="/admin/listings" className="stat-card">
          <span className="stat-label">Leased</span>
          <strong className="stat-value">{stats.leased}</strong>
          <span className="stat-hint">{stats.occupancy}% occupancy</span>
        </Link>
        <Link href="/admin/enquiries" className="stat-card">
          <span className="stat-label">New enquiries</span>
          <strong className="stat-value gold">{newEnquiries}</strong>
          <span className="stat-hint">waiting for a first reply</span>
        </Link>
      </div>

      <div className="admin-cols">
        <section className="panel">
          <div className="panel-head">
            <h2>Latest enquiries</h2>
            <Link href="/admin/enquiries" className="link-arrow">
              View all →
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
                      {e.listing_title ?? '(removed listing)'} · {formatDate(e.created_at)}
                    </span>
                  </div>
                  <span className={`status-pill s-${e.status}`}>{e.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">No enquiries yet.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Recent listings</h2>
            <Link href="/admin/listings" className="link-arrow">
              Manage →
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
                  <span className={`status-pill s-${l.status}`}>{l.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-note">No listings yet — create your first one.</p>
          )}
        </section>
      </div>
    </div>
  );
}
