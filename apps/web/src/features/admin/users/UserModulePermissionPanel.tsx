'use client';

export function UserModulePermissionPanel({ permissions }: { permissions?: string[] }) {
  return (
    <section className="psm-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Module Permissions</h2>
      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {(permissions ?? []).map((permission) => <span key={permission} className="rounded-md border border-[var(--psm-line)] px-3 py-2 text-xs">{permission}</span>)}
        {!(permissions ?? []).length ? <span className="text-sm text-[var(--psm-muted)]">Effective permissions load from backend role and override grants.</span> : null}
      </div>
    </section>
  );
}
