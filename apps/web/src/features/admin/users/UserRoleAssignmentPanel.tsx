'use client';

import type { IamUser } from '@/services/iam.service';

export function UserRoleAssignmentPanel({ user }: { user: IamUser }) {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Roles</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {(user.userRoles ?? []).map((assignment) => assignment.role ? <span key={assignment.role.id} className="psm-badge psm-badge-info">{assignment.role.name}</span> : null)}
        {!(user.userRoles ?? []).length ? <span className="text-sm text-[var(--psm-muted)]">No role assignments.</span> : null}
      </div>
    </section>
  );
}
