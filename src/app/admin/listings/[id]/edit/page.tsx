import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getListing } from '@/lib/listings';
import ListingForm from '@/components/listing-form';
import{getSession}from'@/lib/session';import{canManagePropertyOperations}from'@/lib/permissions';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: Props) {
  const session=await getSession();if(!canManagePropertyOperations(session?.role??''))return <div className="admin-page"><p className="empty-note">ليست لديك صلاحية تعديل الإعلانات.</p></div>;
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const listing = await getListing(id);
  if (!listing) notFound();

  return (
    <div className="admin-page narrow">
      <div className="admin-page-head">
        <div>
          <h1>تعديل الإعلان</h1>
          <p className="admin-sub">
            {listing.title} · last updated {listing.updated_at.slice(0, 10)}
          </p>
        </div>
        <div className="admin-actions">
          <Link href={`/properties/${listing.id}`} className="btn btn-outline btn-sm" target="_blank">
            عرض على الموقع ↗
          </Link>
          <Link href="/admin/listings" className="btn btn-ghost btn-sm">
            العودة ←
          </Link>
        </div>
      </div>
      <ListingForm listing={listing} />
    </div>
  );
}
