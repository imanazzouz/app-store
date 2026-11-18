import Link from 'next/link';
import { getListingCounts, getListings } from '@/lib/listings';
import { propertyTypes, type PropertyType, typeLabels } from '@/lib/validation';
import FilterBar from '@/components/filter-bar';
import PropertyCard from '@/components/property-card';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'العقارات', description: 'تصفح العقارات التجارية والسكنية والمستودعات المتاحة للإيجار في الجزائر.' };
type Props = { searchParams: Promise<{ type?: string; available?: string }> };
function parseType(value: string | undefined): PropertyType | undefined { return propertyTypes.includes(value as PropertyType) ? value as PropertyType : undefined; }
const n = (value: number) => new Intl.NumberFormat('ar-DZ').format(value);

export default async function PropertiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const type = parseType(params.type);
  const availableOnly = params.available === '1';
  const [counts, listings] = await Promise.all([getListingCounts(), getListings({ type, availableOnly })]);
  const heading = type ? `عقارات ${typeLabels[type]}` : availableOnly ? 'الوحدات المتاحة' : 'كامل المحفظة';
  return <div className="page">
    <section className="page-head"><div className="container">
      <nav className="breadcrumbs" aria-label="مسار الصفحة"><Link href="/">الرئيسية</Link><span aria-hidden="true">/</span><span aria-current="page">العقارات</span></nav>
      <div className="page-title-row"><div><p className="eyebrow dark">المحفظة العقارية</p><h1>{heading}</h1><p className="page-sub">{n(listings.length)} وحدة{availableOnly ? ' متاحة حالياً' : ''} · يجري فريق التأجير تحديث البيانات باستمرار.</p></div></div>
      <FilterBar counts={counts} active={type ?? 'all'} availableOnly={availableOnly} />
    </div></section>
    <section className="section"><div className="container">
      {listings.length ? <div className="card-grid">{listings.map((listing) => <PropertyCard key={listing.id} listing={listing} />)}</div> : <div className="empty-state"><h2>لا توجد وحدات مطابقة للتصفية</h2><p>جرّب نوعاً آخر أو ألغِ خيار الوحدات المتاحة فقط لعرض الوحدات المؤجرة حديثاً أيضاً.</p><Link href="/properties" className="btn btn-primary">إعادة ضبط التصفية</Link></div>}
    </div></section>
  </div>;
}
