import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import ChangePasswordForm from '@/components/change-password-form';
import AddUserForm from '@/components/add-user-form';
import UserList from '@/components/user-list';
import SiteSettingsForm from '@/components/site-settings-form';
import { getSiteSettings } from '@/lib/site-settings';
import {canManageRoles,canManageSiteSettings} from '@/lib/permissions';

export default async function SettingsPage() {
  const session = await getSession();
  const canEditSettings = canManageSiteSettings(session?.role ?? '');
  const canEditRoles = canManageRoles(session?.role ?? '');
  const [users, siteSettings] = await Promise.all([canEditRoles?query<{
    id: number;
    name: string;
    email: string;
    role: string;
    active:boolean;
    created_at: Date | string;
  }>('SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at ASC, id ASC'):Promise.resolve([]), getSiteSettings()]);

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>الإعدادات</h1>
          <p className="admin-sub">إدارة كلمة المرور وصلاحيات الفريق.</p>
        </div>
      </div>

      <div className="admin-cols">
        <section className="panel form-panel">
          <h2>تغيير كلمة المرور</h2>
          <ChangePasswordForm />
        </section>

        <section className="panel form-panel">
          <h2>مستويات الوصول</h2>
          <ul className="info-list">
            <li><strong>الموظف العقاري</strong> — العملاء والزيارات والإعلانات وطلبات العقود والصيانة.</li>
            <li><strong>مدير العقارات</strong> — اعتماد العقود والإنهاء والاقتطاعات التشغيلية.</li>
            <li><strong>المحاسب</strong> — الدفعات والمصروفات والقيود المالية وطلبات الرد.</li>
            <li><strong>المدير العام</strong> — إعدادات الموافقات والأدوار والعمليات الحساسة.</li>
            <li><strong>مدير النظام</strong> — صلاحيات كاملة وإدارة الحسابات.</li>
            <li>تغيير الدور أو تعطيل الحساب يبطل الجلسات القائمة.</li>
          </ul>
        </section>
      </div>

      <section className="panel form-panel">
        <h2>بيانات التواصل وسعر الصرف</h2>
        {canEditSettings ? <SiteSettingsForm settings={siteSettings} /> : <p className="empty-note">يمكن للمدير فقط تعديل بيانات التواصل وسعر التحويل.</p>}
      </section>

      {canEditRoles&&<section className="panel form-panel">
        <div className="panel-head">
          <h2>حسابات الفريق ({users.length})</h2>
        </div>
        <UserList users={users.map((u) => ({ ...u, created_at: String(u.created_at) }))} currentUserId={session?.userId ?? -1} canManage={canEditRoles} canAssignAdmin={session?.role==='admin'} />
      </section>}

      {canEditRoles ? (
        <section className="panel form-panel">
          <h2>إضافة عضو للفريق</h2>
          <AddUserForm canAssignAdmin={session?.role==='admin'} />
        </section>
      ) : (
        <section className="panel form-panel">
          <h2>إضافة عضو للفريق</h2>
          <p className="empty-note">يمكن للمديرين فقط إنشاء الحسابات.</p>
        </section>
      )}
    </div>
  );
}
