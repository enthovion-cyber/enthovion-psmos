'use client';

import { useState } from 'react';
import { RegulatoryHeader } from './RegulatoryHeader';
import { RegulatoryLayout } from './layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState, regulatoryInputClass } from './shared/RegulatoryUi';
import { useRegulatoryHistory } from './hooks/useRegulatoryHistory';

export function RegulatoryHistoryPage() {
  const [filters, setFilters] = useState<Record<string, unknown>>({ limit: 50 });
  const query = useRegulatoryHistory(filters);
  if (query.isLoading) return <RegulatoryLayout current="History"><RegulatoryLoadingState rows={6} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="History"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="History">
      <div className="space-y-5">
        <RegulatoryHeader title="Regulatory History" subtitle="Immutable regulatory history timeline backed by audit/history events." onRefresh={() => query.refetch()} />
        <RegulatoryCard title="Filters / Search" subtitle="History filters are sent to the backend.">
          <div className="grid gap-3 md:grid-cols-3">
            <input className={regulatoryInputClass()} placeholder="Search event title/description" value={String(filters.search ?? '')} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
            <input className={regulatoryInputClass()} placeholder="Event type" value={String(filters.eventType ?? '')} onChange={(event) => setFilters({ ...filters, eventType: event.target.value })} />
            <input className={regulatoryInputClass()} placeholder="Source module" value={String(filters.sourceModule ?? '')} onChange={(event) => setFilters({ ...filters, sourceModule: event.target.value })} />
          </div>
        </RegulatoryCard>
        <RegulatoryCard title="Timeline" subtitle="Restricted records are redacted by backend policy before they reach the UI.">
          {query.data?.rows?.length ? <div className="space-y-3">{query.data.rows.map((event) => <div key={event.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="font-semibold text-[var(--psm-fg)]">{event.event_title}</div><div className="mt-1 text-xs text-[var(--psm-muted)]">{event.event_type} · {event.created_at ? new Date(event.created_at).toLocaleString() : 'No timestamp'}</div>{event.event_description ? <p className="mt-2 text-sm text-[var(--psm-muted)]">{event.event_description}</p> : null}</div>)}</div> : <p className="text-sm text-[var(--psm-muted)]">No regulatory history events match the current filters.</p>}
        </RegulatoryCard>
      </div>
    </RegulatoryLayout>
  );
}
