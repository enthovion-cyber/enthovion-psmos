'use client';

import type { IamPermission } from '@/services/iam.service';

export function RolePermissionMatrix({ permissions }: { permissions: IamPermission[] }) {
  const grouped = permissions.reduce<Record<string, IamPermission[]>>((acc, permission) => {
    const key = permission.moduleKey || 'general';
    acc[key] = [...(acc[key] ?? []), permission];
    return acc;
  }, {});
  return (
    <div className="grid gap-3">
      {Object.entries(grouped).map(([moduleKey, rows]) => (
        <section key={moduleKey} className="rounded-lg border border-[var(--psm-line)] p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">{moduleKey}</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((permission) => <span key={permission.id} className="rounded-md bg-[var(--psm-surface-2)] px-3 py-2 text-xs">{permission.key}</span>)}
          </div>
        </section>
      ))}
    </div>
  );
}
