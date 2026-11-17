import Link from 'next/link';
import ListingForm from '@/components/listing-form';

export default function NewListingPage() {
  return (
    <div className="admin-page narrow">
      <div className="admin-page-head">
        <div>
          <h1>New listing</h1>
          <p className="admin-sub">It goes live on the website the moment you save.</p>
        </div>
        <Link href="/admin/listings" className="btn btn-ghost btn-sm">
          ← Back to listings
        </Link>
      </div>
      <ListingForm />
    </div>
  );
}
