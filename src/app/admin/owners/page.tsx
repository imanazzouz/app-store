import{canManagePropertyOperations}from'@/lib/permissions';
import{getSession}from'@/lib/session';
import { getOwners } from '@/lib/assets';
import { OwnerForm } from '@/components/asset-forms';
export const dynamic = 'force-dynamic';
export default async function OwnersPage() {
const accessSession=await getSession();if(!canManagePropertyOperations(accessSession?.role??''))return <div className="admin-page"><p className="empty-note">ليست لديك صلاحية عرض هذه الصفحة.</p></div>;
  const owners = await getOwners();
  return <div className="admin-page"><div className="admin-page-head"><div><h1>الملاك</h1><p className="admin-sub">سجل الأفراد والشركات المالكة وأطراف التواصل.</p></div></div>
    <section className="panel form-panel"><h2>إضافة مالك</h2><OwnerForm /></section>
    <section className="panel table-panel"><table className="admin-table"><thead><tr><th>المالك</th><th>النوع</th><th>التواصل</th><th>العنوان</th></tr></thead><tbody>{owners.map((o)=><tr key={o.id}><td data-label="المالك">{o.legal_name}</td><td data-label="النوع">{o.owner_type==='company'?'شركة':'فرد'}</td><td data-label="التواصل">{o.email||'—'}{o.phone?<span className="cell-sub">{o.phone}</span>:null}</td><td data-label="العنوان">{o.mailing_address||'—'}</td></tr>)}</tbody></table>{!owners.length&&<div className="empty-state"><h2>لا يوجد ملاك مسجلون</h2><p>أضف الملاك لربطهم بالعقارات.</p></div>}</section>
  </div>;
}
