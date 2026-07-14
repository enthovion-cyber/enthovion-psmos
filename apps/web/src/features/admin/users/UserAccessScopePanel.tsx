'use client';

import type { IamUser } from '@/services/iam.service';

export function UserAccessScopePanel({ user }: { user: IamUser }) {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Company / Site / Unit / Area Access</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {(user.userSites ?? []).map((access) => <span key={access.site?.id ?? access.site?.name} className="psm-badge psm-badge-muted">{access.site?.name ?? 'Site access'}</span>)}
        {!(user.userSites ?? []).length ? <span className="text-sm text-[var(--psm-muted)]">No explicit site access assigned.</span> : null}
      </div>
    </section>
  );
}
