import type { AuditDetail } from '../../types/audit.types';
import { AuditCard, AuditEmptyState } from '../../shared/AuditUi';
import { AuditCoverageLevelBadge } from '../../shared/AuditCoverageLevelBadge';

export function ProgramModulesTab({ detail }: { detail: AuditDetail }) {
  return <AuditCard title="Modules Covered" subtitle="PTW, MOC, PSSR, HAZOP/PHA, LOPA/SIL, PSI, MI, Incident, Training, Document Control, Action Engine/CAPA and other module coverage foundation.">{detail.modules.length ? <div className="grid gap-3 md:grid-cols-2">{detail.modules.map((row, i) => <div key={row.id ?? i} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex items-center justify-between gap-2"><b>{row.module_name}</b><AuditCoverageLevelBadge value={row.coverage_level} /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{row.coverage_reason ?? 'No coverage reason'} | Evidence: {row.evidence_source ?? 'Future adapter'}</p></div>)}</div> : <AuditEmptyState title="Missing module coverage" message="Activation requires at least one covered module." />}</AuditCard>;
}
