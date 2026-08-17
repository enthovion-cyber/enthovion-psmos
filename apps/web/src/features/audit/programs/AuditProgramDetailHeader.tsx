import { AuditButton } from '../shared/AuditUi';
import { AuditConfigurationHealthBadge } from '../shared/AuditConfigurationHealthBadge';
import { AuditCriticalityBadge } from '../shared/AuditCriticalityBadge';
import { AuditProgramStatusBadge } from '../shared/AuditProgramStatusBadge';
import type { AuditDetail } from '../types/audit.types';

export function AuditProgramDetailHeader({ detail }: { detail: AuditDetail }) {
  const program = detail.program;
  const archived = Boolean(program.archived_at) || program.program_status === 'Archived';
  return <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">{program.program_code}</p><h1 className="mt-2 text-3xl font-bold">{program.program_title}</h1><p className="mt-2 text-sm text-[var(--psm-muted)]">{program.description ?? 'No description provided.'}</p><div className="mt-3 flex flex-wrap gap-2"><AuditProgramStatusBadge status={program.program_status} /><AuditCriticalityBadge value={program.criticality} /><AuditConfigurationHealthBadge value={program.configuration_health} />{archived ? <span className="rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-xs font-semibold text-danger">Read-only archived</span> : null}</div></div><div className="flex flex-wrap gap-2"><AuditButton href={`/audit-compliance/programs/${program.id}/edit`} disabled={archived} title="Archived programs are read-only until reactivated." variant="secondary">Edit</AuditButton><AuditButton href="/audit-compliance/programs" variant="secondary">Register</AuditButton></div></div></header>;
}
