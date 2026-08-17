'use client';

import { useQuery } from '@tanstack/react-query';
import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { auditHistoryService } from '../services/audit-history.service';
import { AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from '../shared/AuditUi';
import { AuditTrendStaleBadge } from '../shared/AuditTrendStaleBadge';

export function AuditSnapshotsPage() {
  const query = useQuery({ queryKey: ['audit', 'history-snapshots'], queryFn: () => auditHistoryService.snapshots() });
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={6} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const rows = query.data?.rows ?? [];
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Historical Snapshots" subtitle="Immutable trend input and methodology snapshots preserved for explainability and management review." /><AuditCard title={`${query.data?.total ?? 0} snapshots`}>{rows.length ? <div className="grid gap-3 md:grid-cols-2">{rows.map((row) => <div key={String(row.id)} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="flex justify-between gap-2"><h3 className="font-semibold">{String(row.title ?? 'Snapshot')}</h3><AuditTrendStaleBadge value={String(row.staleStatus ?? 'Current')} /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{String(row.snapshotType ?? 'Snapshot')}</p><p className="mt-2 text-xs text-[var(--psm-muted)]">Calculated {row.calculatedAt ? new Date(String(row.calculatedAt)).toLocaleString() : 'Not calculated'}</p></div>)}</div> : <AuditEmptyState title="No snapshots" message="Trend runs create input and methodology snapshots after calculation." />}</AuditCard></div></AuditLayout>;
}
