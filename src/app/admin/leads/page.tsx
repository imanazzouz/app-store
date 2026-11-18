import{canManagePropertyOperations}from'@/lib/permissions';
import{getSession}from'@/lib/session';
import { getLeads } from '@/lib/crm';
import { LEAD_STAGE_LABELS } from '@/lib/lead-stages';
import { getListings } from '@/lib/listings';
import { LeadForm, LeadStageControl } from '@/components/crm-forms';

export const dynamic = 'force-dynamic';
const sourceLabels: Record<string,string> = { website:'الموقع الإلكتروني',phone:'الهاتف',email:'البريد الإلكتروني',manual:'يدوي',campaign:'حملة تسويقية' };
const date = (value:string) => new Intl.DateTimeFormat('ar-DZ',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));

export default async function LeadsAdminPage() {
const accessSession=await getSession();if(!canManagePropertyOperations(accessSession?.role??''))return <div className="admin-page"><p className="empty-note">ليست لديك صلاحية عرض هذه الصفحة.</p></div>;
  const [leads,listings] = await Promise.all([getLeads(),getListings()]);
  return <div className="admin-page">
    <div className="admin-page-head"><div><h1>العملاء المحتملون (CRM)</h1><p className="admin-sub">تتبع الطلبات ومصادرها ومراحل التحويل حتى التعاقد.</p></div><a href="/admin/visits" className="btn btn-outline btn-sm">الزيارات ←</a></div>
    <section className="panel form-panel"><h2>إضافة عميل يدوياً</h2><LeadForm listings={listings} /></section>
    <section className="panel table-panel"><table className="admin-table"><thead><tr><th>العميل</th><th>العقار المطلوب</th><th>المصدر / المسؤول</th><th>تاريخ الطلب</th><th>المرحلة</th><th>تحديث المرحلة</th></tr></thead><tbody>
      {leads.map((lead) => <tr key={lead.id}><td data-label="العميل"><strong>{lead.contact_name}</strong><span className="cell-sub">{lead.email}{lead.phone ? ` · ${lead.phone}` : ''}</span></td><td data-label="العقار">{lead.listing_title ?? 'غير محدد'}{lead.message ? <span className="cell-sub">{lead.message}</span> : null}</td><td data-label="المصدر / المسؤول">{sourceLabels[lead.source] ?? lead.source}<span className="cell-sub">{lead.assigned_name ?? 'غير مسند'}</span></td><td data-label="تاريخ الطلب">{date(lead.created_at)}</td><td data-label="المرحلة"><span className="status-pill">{LEAD_STAGE_LABELS[lead.stage] ?? lead.stage}</span></td><td data-label="تحديث المرحلة"><LeadStageControl lead={lead} /></td></tr>)}
    </tbody></table>{!leads.length && <div className="empty-state"><h2>لا توجد طلبات بعد</h2><p>ستظهر استفسارات الموقع هنا، ويمكن إضافة العملاء يدوياً.</p></div>}</section>
  </div>;
}
