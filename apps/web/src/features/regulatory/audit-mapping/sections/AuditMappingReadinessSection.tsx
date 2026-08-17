import { RegulatoryCard } from '../../shared/RegulatoryUi';
import { AuditMappingStatusStrip, valueText } from '../AuditMappingUi';

export function AuditMappingReadinessSection({ mapping, gaps }: { mapping?: Record<string, any>; gaps?: { rows?: Record<string, any>[] } }) {
  return <RegulatoryCard title="Audit Readiness / Missing Data" subtitle="Backend source of truth for ready-for-audit and not-ready blockers."><AuditMappingStatusStrip row={mapping as any} /><div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-lg bg-[var(--psm-surface-2)] p-3"><b>{valueText(mapping?.coverage_score ?? 0)}</b><p className="text-xs text-[var(--psm-muted)]">Coverage score</p></div><div className="rounded-lg bg-[var(--psm-surface-2)] p-3"><b>{gaps?.rows?.length ?? 0}</b><p className="text-xs text-[var(--psm-muted)]">Open mapping gaps</p></div><div className="rounded-lg bg-[var(--psm-surface-2)] p-3"><b>{valueText(mapping?.stale_status, 'Current')}</b><p className="text-xs text-[var(--psm-muted)]">Stale state</p></div></div></RegulatoryCard>;
}
