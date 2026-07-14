'use client';

import type { IamUser } from '@/services/iam.service';
import { AdminUserStatusBadge } from '../components/shared/AdminUserStatusBadge';

export function UserTable({ users }: { users: IamUser[] }) {
  return (
    <div className="overflow-auto rounded-lg border border-[var(--psm-line)]">
      <table className="psm-table w-full min-w-[760px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Role Summary</th>
            <th className="px-4 py-3">Site Access</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-[var(--psm-line)]">
              <td className="px-4 py-3">
                <div className="font-semibold">{user.displayName}</div>
                <div className="text-xs text-[var(--psm-muted)]">{user.email}</div>
              </td>
              <td className="px-4 py-3">{(user.userRoles ?? []).map((row) => row.role?.name).filter(Boolean).join(', ') || 'No roles'}</td>
              <td className="px-4 py-3">{(user.userSites ?? []).map((row) => row.site?.name).filter(Boolean).join(', ') || 'No site access'}</td>
              <td className="px-4 py-3">{user.department ?? 'Not assigned'}</td>
              <td className="px-4 py-3"><AdminUserStatusBadge status={user.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
