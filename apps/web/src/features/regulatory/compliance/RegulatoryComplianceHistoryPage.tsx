'use client';

import { useQuery } from '@tanstack/react-query';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { regulatoryComplianceService } from '../services/regulatory-compliance.service';

type ComplianceHistoryEvent = {
  id?: string;
  event_type?: string | null;
  event_title?: string | null;
  event_description?: string | null;
  source_system?: string | null;
  actor_user_id?: string | null;
  reason?: string | null;
  created_at?: string | null;
};

export function RegulatoryComplianceHistoryPage({ title = 'Compliance Status History', initialFilters }: { title?: string; initialFilters?: Record<string, unknown> | undefined }) {
  const query = useQuery({ queryKey: ['regulatory', 'compliance', 'history', initialFilters], queryFn: () => regulatoryComplianceService.history(initialFilters), refetchOnWindowFocus: false });
  if (query.isLoading) return <RegulatoryLayout current="Compliance Status"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Compliance Status"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const rows = (query.data?.rows ?? []) as ComplianceHistoryEvent[];
  return (
    <RegulatoryLayout current="Compliance Status">
      <div className="space-y-5">
        <RegulatoryHeader title={title} subtitle="Immutable compliance assessment, gap, evidence readiness, stale status, rollup, and decision events." onRefresh={() => query.refetch()} />
        <RegulatoryCard title="Event Timeline" subtitle={`${rows.length} backend history event${rows.length === 1 ? '' : 's'} returned in your company/site scope.`}>
          {rows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">
                  <tr><th className="px-3 py-2">Event</th><th className="px-3 py-2">Description</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2">Actor</th><th className="px-3 py-2">Created</th></tr>
                </thead>
                <tbody className="divide-y divide-[var(--psm-line)]">
                  {rows.map((row) => (
                    <tr key={row.id ?? `${row.event_title}-${row.created_at}`} className="align-top">
                      <td className="px-3 py-3 font-semibold text-[var(--psm-fg)]">{row.event_title ?? row.event_type ?? 'Compliance event'}<div className="text-xs font-normal text-[var(--psm-muted)]">{row.source_system ?? 'Regulatory Compliance'}</div></td>
                      <td className="px-3 py-3 text-[var(--psm-muted)]">{row.event_description ?? 'No description returned.'}</td>
                      <td className="px-3 py-3 text-[var(--psm-muted)]">{row.reason ?? 'No reason recorded.'}</td>
                      <td className="px-3 py-3 text-[var(--psm-muted)]">{row.actor_user_id ?? 'System'}</td>
                      <td className="px-3 py-3 text-[var(--psm-muted)]">{row.created_at ? new Date(row.created_at).toLocaleString() : 'Not recorded'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-[var(--psm-muted)]">No compliance history events were returned for this scope.</p>}
        </RegulatoryCard>
      </div>
    </RegulatoryLayout>
  );
}
