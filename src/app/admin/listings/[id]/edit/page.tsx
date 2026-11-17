import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListing } from '@/lib/listings';
import ListingForm from '@/components/listing-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: Props) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const listing = await getListing(id);
  if (!listing) notFound();

  return (
    <div className="admin-page narrow">
      <div className="admin-page-head">
        <div>
          <h1>Edit listing</h1>
          <p className="admin-sub">
            {listing.title} · last updated {listing.updated_at.slice(0, 10)}
          </p>
        </div>
        <div className="admin-actions">
          <Link href={`/properties/${listing.id}`} className="btn btn-outline btn-sm" target="_blank">
            View on site ↗
          </Link>
          <Link href="/admin/listings" className="btn btn-ghost btn-sm">
            ← Back
          </Link>
        </div>
      </div>
      <ListingForm listing={listing} />
    </div>
  );
}
