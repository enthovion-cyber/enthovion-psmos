import { RegulatoryCard } from '../shared/RegulatoryUi';
import type { RegulatoryComplianceDetail } from '../types/regulatory-compliance.types';

export function ComplianceActionsTab({ detail }: { detail?: RegulatoryComplianceDetail | undefined }) {
  const rows = detail?.actions?.rows ?? [];
  return <RegulatoryCard title="Action / CAPA Foundation">{rows.length ? <div className="space-y-2">{rows.map((row) => <div key={row.id} className="rounded-lg bg-[var(--psm-surface-2)] p-3 text-sm"><b>{row.gap_title}</b><div className="text-[var(--psm-muted)]">Action: {row.action_id ?? 'Not linked'} · CAPA: {row.capa_id ?? 'Not linked'}</div></div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No action or CAPA foundation links returned.</p>}</RegulatoryCard>;
}
