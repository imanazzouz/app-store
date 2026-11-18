import{canManagePropertyOperations}from'@/lib/permissions';
import{getSession}from'@/lib/session';
import { getPortfolios } from '@/lib/assets';
import { PortfolioForm } from '@/components/asset-forms';
export const dynamic = 'force-dynamic';
const n=(value:number)=>new Intl.NumberFormat('ar-DZ').format(value);
export default async function PortfoliosPage() {
const accessSession=await getSession();if(!canManagePropertyOperations(accessSession?.role??''))return <div className="admin-page"><p className="empty-note">ليست لديك صلاحية عرض هذه الصفحة.</p></div>;
  const portfolios=await getPortfolios();
  return <div className="admin-page"><div className="admin-page-head"><div><h1>المحافظ العقارية</h1><p className="admin-sub">تجميع العقارات لأغراض الإدارة والتقارير.</p></div></div>
    <section className="panel form-panel"><h2>إنشاء محفظة</h2><PortfolioForm /></section>
    <section className="panel table-panel"><table className="admin-table"><thead><tr><th>الرمز</th><th>المحفظة</th><th>الوصف</th><th>العقارات</th></tr></thead><tbody>{portfolios.map((p)=><tr key={p.id}><td data-label="الرمز">{p.code}</td><td data-label="المحفظة">{p.name}</td><td data-label="الوصف">{p.description||'—'}</td><td data-label="العقارات">{n(p.property_count)}</td></tr>)}</tbody></table>{!portfolios.length&&<div className="empty-state"><h2>لا توجد محافظ بعد</h2><p>أنشئ محفظة ثم اربطها بالعقارات عند إضافتها.</p></div>}</section>
  </div>;
}
