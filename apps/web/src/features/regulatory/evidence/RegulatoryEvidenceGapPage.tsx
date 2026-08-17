'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { RegulatoryEvidenceGapBadge } from '../shared/RegulatoryEvidenceGapBadge';
import { useRegulatoryEvidenceGaps } from '../hooks/useRegulatoryEvidenceGaps';
import { useRegulatoryEvidenceMutations } from '../hooks/useRegulatoryEvidenceMutations';

export function RegulatoryEvidenceGapPage({ initialFilters }: { initialFilters?: Record<string, unknown> } = {}) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ limit: 100, ...(initialFilters ?? {}) });
  const query = useRegulatoryEvidenceGaps(filters);
  const mutations = useRegulatoryEvidenceMutations();
  if (query.isLoading) return <RegulatoryLayout current="Evidence"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Evidence"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const rows = query.data?.rows ?? [];
  return <RegulatoryLayout current="Evidence"><div className="space-y-5"><RegulatoryHeader title="Evidence Gaps" subtitle="Backend-detected and manually created gaps for missing, rejected, stale, expired, restricted, or incomplete evidence." onRefresh={() => query.refetch()} action={<RegulatoryButton onClick={() => mutations.createGap.mutate({ gapTitle: 'Manual evidence gap', gapType: 'Other', sourceType: 'Manual Requirement' })}>Create Gap</RegulatoryButton>} /><RegulatoryCard title="Filters"><input className="min-h-10 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-sm" placeholder="Search gaps" value={String(filters.search ?? '')} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></RegulatoryCard>{rows.length ? <RegulatoryCard title="Gap Register"><div className="space-y-3">{rows.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><b>{row.gap_code ?? row.id}</b><div>{row.gap_title}</div><div className="text-sm text-[var(--psm-muted)]">{row.gap_type} · {row.gap_severity} · due {row.due_date ? new Date(row.due_date).toLocaleDateString() : 'not set'}</div></div><RegulatoryEvidenceGapBadge status={row.gap_status} /></div></div>)}</div></RegulatoryCard> : <RegulatoryEmptyState title="No evidence gaps" message="No open evidence gaps are present for this scope." />}</div></RegulatoryLayout>;
}
