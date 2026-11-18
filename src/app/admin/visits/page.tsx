import{canManagePropertyOperations}from'@/lib/permissions';
import{getSession}from'@/lib/session';
import { getLeads, getVisits } from '@/lib/crm';
import { getManagedUnits } from '@/lib/assets';
import { VisitForm } from '@/components/crm-forms';

export const dynamic = 'force-dynamic';
const statusLabels: Record<string,string> = { scheduled:'مجدولة',completed:'مكتملة',cancelled:'ملغاة',no_show:'لم يحضر' };
const date = (value:string) => new Intl.DateTimeFormat('ar-DZ',{dateStyle:'full',timeStyle:'short'}).format(new Date(value));

export default async function VisitsAdminPage() {
const accessSession=await getSession();if(!canManagePropertyOperations(accessSession?.role??''))return <div className="admin-page"><p className="empty-note">ليست لديك صلاحية عرض هذه الصفحة.</p></div>;
  const [leads,units,visits] = await Promise.all([getLeads(),getManagedUnits(),getVisits()]);
  return <div className="admin-page">
    <div className="admin-page-head"><div><h1>الزيارات العقارية</h1><p className="admin-sub">جدولة الزيارات وربطها بالعملاء والوحدات المطلوبة.</p></div><a href="/admin/leads" className="btn btn-outline btn-sm">العودة إلى العملاء ←</a></div>
    <section className="panel form-panel"><h2>جدولة زيارة</h2><p className="panel-note">يمنع النظام حجز الوحدة أو الموظف نفسه في الموعد ذاته.</p><VisitForm leads={leads} units={units} /></section>
    <section className="panel table-panel"><table className="admin-table"><thead><tr><th>العميل</th><th>الوحدة</th><th>الموعد</th><th>الموظف</th><th>الحالة / ملاحظات</th></tr></thead><tbody>
      {visits.map((v) => <tr key={v.id}><td data-label="العميل">{v.contact_name}</td><td data-label="الوحدة">{v.unit_label ?? 'غير محددة'}</td><td data-label="الموعد">{date(v.scheduled_at)}</td><td data-label="الموظف">{v.assigned_name ?? 'غير مسند'}</td><td data-label="الحالة">{statusLabels[v.status] ?? v.status}{v.notes ? <span className="cell-sub">{v.notes}</span> : null}</td></tr>)}
    </tbody></table>{!visits.length && <div className="empty-state"><h2>لا توجد زيارات مجدولة</h2><p>استخدم النموذج أعلاه لإنشاء أول موعد.</p></div>}</section>
  </div>;
}
