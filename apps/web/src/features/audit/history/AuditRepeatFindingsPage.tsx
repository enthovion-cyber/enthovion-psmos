'use client';

import { useState } from 'react';
import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { useAuditRepeatFindings } from '../hooks/useAuditRepeatFindings';
import { AuditButton, AuditCard, AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { AuditRepeatFindingsTable } from './AuditRepeatFindingsTable';
import { AuditRepeatFindingReviewPanel } from './AuditRepeatFindingReviewPanel';

export function AuditRepeatFindingsPage() {
  const { query, detect, review } = useAuditRepeatFindings();
  const [selected, setSelected] = useState<{ id: string; action: 'confirm' | 'reject' | 'mark-recurring' | 'mark-systemic' } | null>(null);
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={8} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-4"><AuditHeader title="Repeat Finding Detection" subtitle="Backend-calculated matches with explainable criteria, review decisions, repeat-after-CAPA highlighting, and finding register updates." actionHref="/audit-compliance/history/recurring-issues" actionLabel="Recurring Issues" /><AuditButton onClick={() => detect.mutate({})} disabled={detect.isPending} title="Run backend repeat finding detection using accessible real findings">{detect.isPending ? 'Detecting...' : 'Detect Repeats'}</AuditButton></div><AuditCard title={`${query.data?.total ?? 0} repeat match records`}><AuditRepeatFindingsTable rows={query.data?.rows ?? []} onReview={(id, action) => setSelected({ id, action })} /></AuditCard><AuditRepeatFindingReviewPanel selected={selected} saving={review.isPending} onSubmit={(reason) => selected && review.mutate({ matchId: selected.id, action: selected.action, data: { reason } })} /></div></AuditLayout>;
}
