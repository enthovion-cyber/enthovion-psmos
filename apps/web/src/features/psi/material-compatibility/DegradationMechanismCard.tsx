import { DegradationRiskBadge } from '../shared/MaterialCompatibilityBadges';

export function DegradationMechanismCard({ item }: { item: Record<string, any> }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{item.mechanism_type ?? 'Mechanism missing'}</p><p className="text-sm text-[var(--psm-muted)]">{item.failure_mode ?? 'Failure mode missing'}</p></div><DegradationRiskBadge value={item.risk_level} /></div><p className="mt-2 text-xs text-[var(--psm-muted)]">{item.monitoring_method ?? item.control_basis ?? item.notes ?? 'No monitoring or control basis recorded.'}</p></div>;
}

