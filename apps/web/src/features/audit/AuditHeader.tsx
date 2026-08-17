import { AuditButton } from './shared/AuditUi';

export function AuditHeader({ title = 'Audit / Compliance Assurance', subtitle, actionHref = '/audit-compliance/programs/new', actionLabel = 'Create Audit Program' }: { title?: string; subtitle?: string; actionHref?: string; actionLabel?: string }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Audit / Compliance Assurance</p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--psm-fg)]">{title}</h1>
        <p className="mt-2 max-w-4xl text-sm text-[var(--psm-muted)]">{subtitle ?? 'Audit program coverage, standards, ownership, frequency, and scheduling readiness foundation.'}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <AuditButton href="/audit-compliance/dashboard" variant="secondary">Dashboard</AuditButton>
        <AuditButton href="/audit-compliance/programs" variant="secondary">Programs</AuditButton>
        <AuditButton href={actionHref}>{actionLabel}</AuditButton>
      </div>
    </header>
  );
}
