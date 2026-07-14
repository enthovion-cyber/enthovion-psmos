import type { ReactNode } from 'react';

export function PermissionModuleCard({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--psm-line)] px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="psm-badge psm-badge-info">{count} allowed</span>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

