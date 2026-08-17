import { RegulatoryCard } from '../shared/RegulatoryUi';

export function RegulatoryAuditMappingStaleWarningPanel({ row }: { row?: Record<string, any> }) {
  if (!row || row.stale_status === 'Current') return null;
  return <RegulatoryCard title="Stale Audit Mapping" subtitle={row.stale_reason ?? 'Backend marked this audit mapping stale.'}><p className="text-sm text-[var(--psm-muted)]">Refresh the traceability snapshot or re-verify the mapping before relying on it for audit readiness.</p></RegulatoryCard>;
}
