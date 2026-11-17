'use client';

import { useRouter } from 'next/navigation';

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export default function UserList({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: number;
}) {
  const router = useRouter();

  async function removeUser(user: UserRow) {
    if (!confirm(`Remove ${user.name} (${user.email})? They will lose access immediately.`)) {
      return;
    }
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'POST' });
    if (res.ok) {
      router.refresh();
    } else {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      alert(json.error || 'Could not remove the account.');
    }
  }

  return (
    <div className="panel table-panel">
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Role</th>
            <th scope="col" className="col-actions">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td data-label="Name">
                {u.name}
                {u.id === currentUserId && <span className="you-tag">you</span>}
              </td>
              <td data-label="Email">{u.email}</td>
              <td data-label="Role">
                <span className={`status-pill ${u.role === 'admin' ? 's-admin' : 's-editor'}`}>
                  {u.role}
                </span>
              </td>
              <td data-label="Actions" className="col-actions">
                {u.id === currentUserId ? (
                  <span className="cell-sub">—</span>
                ) : (
                  <button type="button" className="btn btn-ghost btn-xs danger" onClick={() => removeUser(u)}>
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
