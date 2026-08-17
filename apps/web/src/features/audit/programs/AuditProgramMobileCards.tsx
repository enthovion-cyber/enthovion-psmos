import type { AuditProgram } from '../types/audit.types';
import { AuditButton, AuditCard } from '../shared/AuditUi';
import { AuditConfigurationHealthBadge } from '../shared/AuditConfigurationHealthBadge';
import { AuditCriticalityBadge } from '../shared/AuditCriticalityBadge';
import { AuditProgramStatusBadge } from '../shared/AuditProgramStatusBadge';

export function AuditProgramMobileCards({ rows }: { rows: AuditProgram[] }) {
  return <div className="space-y-3 lg:hidden">{rows.map((row) => <AuditCard key={row.id}><div className="space-y-3"><div className="flex items-start justify-between gap-3"><div><b>{row.program_code}</b><p className="text-sm text-[var(--psm-muted)]">{row.program_title}</p></div><AuditProgramStatusBadge status={row.program_status} /></div><div className="flex flex-wrap gap-2"><AuditCriticalityBadge value={row.criticality} /><AuditConfigurationHealthBadge value={row.configuration_health} /></div><div className="grid grid-cols-2 gap-2 text-sm text-[var(--psm-muted)]"><span>Scope: {(row.scopes ?? []).length}</span><span>Standards: {(row.standards ?? []).length}</span><span>Modules: {(row.modules ?? []).length}</span><span>Owner: {row.owner?.displayName ?? 'Missing'}</span></div><div className="flex gap-2"><AuditButton href={`/audit-compliance/programs/${row.id}`} variant="secondary">View</AuditButton><AuditButton href={`/audit-compliance/programs/${row.id}/edit`} variant="secondary" disabled={row.program_status === 'Archived'} title="Archived programs are read-only.">Edit</AuditButton></div></div></AuditCard>)}</div>;
}
