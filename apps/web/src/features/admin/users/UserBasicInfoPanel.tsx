'use client';

import type { IamUser } from '@/services/iam.service';

export function UserBasicInfoPanel({ user }: { user: IamUser }) {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Basic Info</h2>
      <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
        <Info label="Name" value={user.displayName} />
        <Info label="Work Email" value={user.email} />
        <Info label="Job Title" value={user.title ?? 'Not set'} />
        <Info label="Department" value={user.department ?? 'Not set'} />
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="font-medium">{value}</div></div>;
}
