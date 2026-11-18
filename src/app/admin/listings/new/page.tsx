import Link from 'next/link';
import ListingForm from '@/components/listing-form';
import{getSession}from'@/lib/session';import{canManagePropertyOperations}from'@/lib/permissions';

export default async function NewListingPage() {
  const session=await getSession();if(!canManagePropertyOperations(session?.role??''))return <div className="admin-page"><p className="empty-note">ليست لديك صلاحية إنشاء إعلان.</p></div>;
  return (
    <div className="admin-page narrow">
      <div className="admin-page-head">
        <div>
          <h1>إعلان جديد</h1>
          <p className="admin-sub">سيُنشر الإعلان على الموقع فور حفظه.</p>
        </div>
        <Link href="/admin/listings" className="btn btn-ghost btn-sm">
          العودة إلى الإعلانات ←
        </Link>
      </div>
      <ListingForm />
    </div>
  );
}
