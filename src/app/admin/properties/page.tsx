import{canManagePropertyOperations}from'@/lib/permissions';
import{getSession}from'@/lib/session';
import Link from 'next/link';
import { getManagedProperties, getOwners, getPortfolios } from '@/lib/assets';
import { PropertyForm } from '@/components/asset-forms';
import { typeLabels } from '@/lib/validation';

export const dynamic = 'force-dynamic';
const n = (value: number) => new Intl.NumberFormat('ar-DZ').format(value);

export default async function PropertiesAdminPage() {
const accessSession=await getSession();if(!canManagePropertyOperations(accessSession?.role??''))return <div className="admin-page"><p className="empty-note">ليست لديك صلاحية عرض هذه الصفحة.</p></div>;
  const [properties, owners, portfolios] = await Promise.all([getManagedProperties(), getOwners(), getPortfolios()]);
  return <div className="admin-page">
    <div className="admin-page-head"><div><h1>العقارات والمباني</h1><p className="admin-sub">سجل الأصول العقارية ومواقعها، مستقلاً عن حالة الإعلان والتأجير.</p></div><Link href="/admin/units" className="btn btn-outline btn-sm">إدارة الوحدات ←</Link></div>
    <section className="panel form-panel"><h2>إضافة عقار</h2><p className="panel-note">يمكن للعقار أن يحتوي على عدة وحدات؛ الإعلانات العامة تدار بشكل منفصل.</p><PropertyForm owners={owners} portfolios={portfolios} /></section>
    <section className="panel table-panel"><table className="admin-table"><thead><tr><th>الرمز</th><th>العقار</th><th>النوع</th><th>الموقع</th><th>المالك / المحفظة</th><th>الوحدات</th></tr></thead><tbody>
      {properties.map((p) => <tr key={p.id}><td data-label="الرمز">{p.code}</td><td data-label="العقار"><strong>{p.name}</strong></td><td data-label="النوع">{p.type === 'mixed' ? 'مختلط' : typeLabels[p.type as keyof typeof typeLabels]}</td><td data-label="الموقع">{[p.municipality, p.wilaya].filter(Boolean).join('، ') || p.address || '—'}</td><td data-label="المالك / المحفظة">{p.owner_name ?? '—'}{p.portfolio_name ? ` · ${p.portfolio_name}` : ''}</td><td data-label="الوحدات">{n(p.unit_count)}</td></tr>)}
    </tbody></table>{!properties.length && <div className="empty-state"><h2>لا توجد عقارات مسجلة</h2><p>ابدأ بإضافة عقار، ثم أضف وحداته من صفحة إدارة الوحدات.</p></div>}</section>
  </div>;
}
