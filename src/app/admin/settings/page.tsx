import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import ChangePasswordForm from '@/components/change-password-form';
import AddUserForm from '@/components/add-user-form';
import UserList from '@/components/user-list';

export default async function SettingsPage() {
  const session = await getSession();
  const users = await query<{
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: Date | string;
  }>('SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC, id ASC');

  const isAdmin = session?.role === 'admin';

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Settings</h1>
          <p className="admin-sub">Your password and the team’s access.</p>
        </div>
      </div>

      <div className="admin-cols">
        <section className="panel form-panel">
          <h2>Change my password</h2>
          <ChangePasswordForm />
        </section>

        <section className="panel form-panel">
          <h2>How access works</h2>
          <ul className="info-list">
            <li>
              <strong>Editor</strong> — add/edit listings, mark leased, handle
              enquiries.
            </li>
            <li>
              <strong>Admin</strong> — everything above, plus team accounts.
            </li>
            <li>Sessions last 12 hours; re-login after that.</li>
            <li>Passwords are stored only as salted hashes.</li>
          </ul>
        </section>
      </div>

      <section className="panel form-panel">
        <div className="panel-head">
          <h2>Team accounts ({users.length})</h2>
        </div>
        <UserList users={users.map((u) => ({ ...u, created_at: String(u.created_at) }))} currentUserId={session?.userId ?? -1} />
      </section>

      {isAdmin ? (
        <section className="panel form-panel">
          <h2>Add a team member</h2>
          <AddUserForm />
        </section>
      ) : (
        <section className="panel form-panel">
          <h2>Add a team member</h2>
          <p className="empty-note">Only administrators can create accounts.</p>
        </section>
      )}
    </div>
  );
}
