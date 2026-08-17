import type { AuditDetail } from '../../types/audit.types';
import { AuditCard, AuditEmptyState } from '../../shared/AuditUi';

export function ProgramStandardsTab({ detail }: { detail: AuditDetail }) {
  return <AuditCard title="Standards / Regulations" subtitle="Regulatory register-ready reference foundation.">{detail.standards.length ? <div className="grid gap-3">{detail.standards.map((row, i) => <div key={row.id ?? i} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><b>{row.standard_name}</b><p className="text-sm text-[var(--psm-muted)]">{row.jurisdiction ?? 'No jurisdiction'} | {row.clause_reference ?? 'No clause'} | Mandatory: {row.mandatory === false ? 'No' : 'Yes'}</p><p className="mt-2 text-sm">{row.evidence_expectation ?? 'No evidence expectation foundation recorded.'}</p></div>)}</div> : <AuditEmptyState title="Missing standards/regulations" message="Activation requires at least one standard unless settings allow an internal-only exception." />}</AuditCard>;
}
