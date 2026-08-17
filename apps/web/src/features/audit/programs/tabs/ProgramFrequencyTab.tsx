import type { AuditDetail } from '../../types/audit.types';
import { AuditCard, AuditEmptyState } from '../../shared/AuditUi';
import { AuditFrequencyBadge } from '../../shared/AuditFrequencyBadge';

export function ProgramFrequencyTab({ detail }: { detail: AuditDetail }) {
  const row = detail.frequency;
  if (!row) return <AuditEmptyState title="Missing frequency / review cycle" message="Activation requires an audit frequency and active programs require a review due date." />;
  return <AuditCard title="Frequency / Review Cycle" action={<AuditFrequencyBadge value={row.audit_frequency} />}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Object.entries(row).filter(([key]) => !['id','company_id','site_id','program_id'].includes(key)).map(([key, value]) => <div key={key} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{key.replaceAll('_', ' ')}</p><p className="mt-1 font-semibold">{String(value ?? 'Missing')}</p></div>)}</div></AuditCard>;
}
