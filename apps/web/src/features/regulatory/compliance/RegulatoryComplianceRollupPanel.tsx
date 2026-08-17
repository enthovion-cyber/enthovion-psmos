'use client';

import { RegulatoryBadge, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryComplianceRollup } from '../hooks/useRegulatoryComplianceRollup';

export function RegulatoryComplianceRollupPanel({ regulationId }: { regulationId?: string | null }) {
  const query = useRegulatoryComplianceRollup(regulationId ?? undefined);
  if (!regulationId) return <RegulatoryCard title="Compliance Rollup"><p className="text-sm text-[var(--psm-muted)]">No parent regulatory item is linked for rollup.</p></RegulatoryCard>;
  if (query.isLoading) return <RegulatoryLoadingState rows={2} />;
  if (query.isError) return <RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} />;
  const rollup = query.data ?? {};
  const entries: Array<[string, unknown]> = [
    ['Obligations', rollup.obligation_count],
    ['Compliant', rollup.compliant_count],
    ['Partial', rollup.partial_count],
    ['Non-compliant', rollup.non_compliant_count],
    ['Evidence missing', rollup.evidence_missing_count],
    ['Open gaps', rollup.open_gap_count],
    ['Blocking gaps', rollup.blocking_gap_count],
    ['Stale', rollup.stale_count]
  ];
  return (
    <RegulatoryCard title="Parent Compliance Rollup" subtitle="Backend-generated obligation-to-requirement compliance rollup. Frontend does not calculate parent status.">
      <div className="mb-4 flex flex-wrap items-center gap-2"><RegulatoryBadge tone={rollup.rollup_status === 'Compliant Foundation' ? 'good' : rollup.rollup_status === 'Non-Compliant Foundation' ? 'danger' : 'warn'}>{String(rollup.rollup_status ?? 'Not Assessed')}</RegulatoryBadge><span className="text-xs text-[var(--psm-muted)]">Calculated {rollup.calculated_at ? new Date(String(rollup.calculated_at)).toLocaleString() : 'not yet'}</span></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{entries.map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">{label}</p><p className="mt-2 text-xl font-bold text-[var(--psm-fg)]">{String(value ?? 0)}</p></div>)}</div>
    </RegulatoryCard>
  );
}
