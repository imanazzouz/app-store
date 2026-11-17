import Link from 'next/link';
import { getListings } from '@/lib/listings';
import AdminListingsTable from '@/components/admin-listings-table';

type Props = { searchParams: Promise<{ saved?: string; deleted?: string }> };

export default async function AdminListingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const listings = await getListings();

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Listings</h1>
          <p className="admin-sub">
            {listings.length} unit{listings.length === 1 ? '' : 's'} in the
            portfolio. “Leased” units stay visible on the site with a Leased
            badge.
          </p>
        </div>
        <div className="admin-actions">
          <Link href="/admin/listings/new" className="btn btn-primary btn-sm">
            + New listing
          </Link>
        </div>
      </div>

      {params.saved && (
        <div className="banner ok" role="status">
          Listing saved — it’s now live on the website.
        </div>
      )}
      {params.deleted && (
        <div className="banner ok" role="status">
          Listing deleted.
        </div>
      )}

      <AdminListingsTable listings={listings} />
    </div>
  );
}
