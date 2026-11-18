import{canManagePropertyOperations}from'@/lib/permissions';
import{getSession}from'@/lib/session';
import Link from 'next/link';
import { getManagedProperties, getManagedUnits } from '@/lib/assets';
import { UnitForm } from '@/components/asset-forms';
import { typeLabels } from '@/lib/validation';

export const dynamic = 'force-dynamic';
const n = (value: number) => new Intl.NumberFormat('ar-DZ').format(value);
const statusLabels: Record<string, string> = { active: 'تعمل', maintenance: 'تحت الصيانة', out_of_service: 'خارج الخدمة', vacant: 'شاغرة', reserved: 'محجوزة', leased: 'مؤجرة' };

export default async function UnitsAdminPage() {
const accessSession=await getSession();if(!canManagePropertyOperations(accessSession?.role??''))return <div className="admin-page"><p className="empty-note">ليست لديك صلاحية عرض هذه الصفحة.</p></div>;
  const [properties, units] = await Promise.all([getManagedProperties(), getManagedUnits()]);
  return <div className="admin-page">
    <div className="admin-page-head"><div><h1>المباني والوحدات</h1><p className="admin-sub">إدارة كل وحدة قابلة للتأجير وسعرها وحالتها التشغيلية والإشغال.</p></div><Link href="/admin/properties" className="btn btn-outline btn-sm">العودة إلى العقارات ←</Link></div>
    <section className="panel form-panel"><h2>إضافة وحدة</h2><UnitForm properties={properties} /></section>
    <section className="panel table-panel"><table className="admin-table"><thead><tr><th>رمز الوحدة</th><th>العقار</th><th>النوع / الطابق</th><th>المساحة</th><th>الإيجار الشهري</th><th>التشغيل / الإشغال</th></tr></thead><tbody>
      {units.map((u) => <tr key={u.id}><td data-label="رمز الوحدة"><strong>{u.code}</strong>{u.label ? <span className="cell-sub">{u.label}</span> : null}</td><td data-label="العقار">{u.property_name}<span className="cell-sub">{u.property_code}</span></td><td data-label="النوع / الطابق">{typeLabels[u.type as keyof typeof typeLabels]}{u.floor ? ` · ${u.floor}` : ''}</td><td data-label="المساحة">{n(u.area_sqm)} م²{u.bedrooms !== null ? ` · ${n(u.bedrooms)} غرف` : ''}</td><td data-label="الإيجار الشهري">{n(u.asking_rent)} دج</td><td data-label="الحالة"><span className="status-pill">{statusLabels[u.operating_status] ?? u.operating_status}</span><span className="cell-sub">{statusLabels[u.occupancy_status] ?? u.occupancy_status}</span></td></tr>)}
    </tbody></table>{!units.length && <div className="empty-state"><h2>لا توجد وحدات بعد</h2><p>أضف وحدة إلى أحد العقارات المسجلة.</p></div>}</section>
  </div>;
}
