import Link from 'next/link';
import { getListings } from '@/lib/listings';
import AdminListingsTable from '@/components/admin-listings-table';
import{getSession}from'@/lib/session';import{canManagePropertyOperations}from'@/lib/permissions';

type Props = { searchParams: Promise<{ saved?: string; deleted?: string }> };

export default async function AdminListingsPage({ searchParams }: Props) {
  const session=await getSession();if(!canManagePropertyOperations(session?.role??''))return <div className="admin-page"><p className="empty-note">ليست لديك صلاحية عرض الإعلانات.</p></div>;
  const params = await searchParams;
  const listings = await getListings();

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>الإعلانات العقارية</h1>
          <p className="admin-sub">
            عدد الإعلانات في المحفظة: {listings.length}. تبقى الوحدات المؤجرة ظاهرة على الموقع مع توضيح حالتها.
          </p>
        </div>
        <div className="admin-actions">
          <Link href="/admin/listings/new" className="btn btn-primary btn-sm">
            + إعلان جديد
          </Link>
        </div>
      </div>

      {params.saved && (
        <div className="banner ok" role="status">
          تم حفظ الإعلان ونشره على الموقع.
        </div>
      )}
      {params.deleted && (
        <div className="banner ok" role="status">
          تم حذف الإعلان.
        </div>
      )}

      <AdminListingsTable listings={listings} />
    </div>
  );
}
