'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryEmptyState, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryObligations } from '../hooks/useRegulatoryObligations';
import { RegulatoryObligationSummaryCards } from './RegulatoryObligationSummaryCards';
import { RegulatoryObligationFilters } from './RegulatoryObligationFilters';
import { RegulatoryObligationTable } from './RegulatoryObligationTable';

export function RegulatoryObligationRegisterPage({ view, initialFilters }: { view?: string; initialFilters?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, sort: 'updated_at.desc', ...(initialFilters ?? {}) });
  const query = useRegulatoryObligations(filters, view);
  if (query.isLoading) return <RegulatoryLayout current="Obligations"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Obligations"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const empty = !Number(query.data?.total ?? 0);
  return (
    <RegulatoryLayout current="Obligations">
      <div className="space-y-5">
        <RegulatoryHeader title={view ? `Obligations - ${view}` : 'Obligation Register'} subtitle="Server-filtered register of actionable regulatory obligations, owners, evidence expectations, module mappings, due status, gaps, and stale state." action={<RegulatoryButton href="/regulatory/obligations/new">Create Obligation</RegulatoryButton>} onRefresh={() => query.refetch()} />
        {empty ? <RegulatoryEmptyState title="No obligations found" message="No obligations match this company/site scope and filter set." action={<RegulatoryButton href="/regulatory/obligations/new">Create Obligation</RegulatoryButton>} /> : null}
        <RegulatoryObligationSummaryCards summary={query.data?.summary} />
        <RegulatoryObligationFilters filters={filters} setFilters={setFilters} loading={query.isFetching} />
        <RegulatoryObligationTable register={query.data} setFilters={(fn) => setFilters((current) => fn(current))} />
      </div>
    </RegulatoryLayout>
  );
}
