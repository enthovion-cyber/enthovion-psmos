'use client';

import { useState } from 'react';
import { useReliefSystems } from '../hooks/useReliefSystems';
import { PsiButton, PsiEmptyState, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { ReliefSystemFilters } from './ReliefSystemFilters';
import { ReliefSystemHeader } from './ReliefSystemHeader';
import { ReliefSystemMobileCards } from './ReliefSystemMobileCards';
import { ReliefSystemSummaryCards } from './ReliefSystemSummaryCards';
import { ReliefSystemTable } from './ReliefSystemTable';

export function ReliefSystemRegistryPage({ unitId, equipmentId, preset }: { unitId?: string | undefined; equipmentId?: string | undefined; preset?: Record<string, unknown> | undefined }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...(preset ?? {}) });
  const query = useReliefSystems(filters, unitId, equipmentId);
  if (query.isLoading) return <PsiLoadingState rows={8} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  const createHref = unitId ? `/process-safety-information/units/${unitId}/relief-systems/new` : '/process-safety-information/relief-systems/new';
  return (
    <div className="space-y-5">
      <ReliefSystemHeader unitId={unitId} lastUpdated={query.data.lastUpdated} />
      <ReliefSystemSummaryCards summary={query.data.summary} />
      <ReliefSystemFilters filters={filters} onChange={setFilters} savedViews={query.data.savedViews} />
      {!query.data.rows.length ? <PsiEmptyState title="No relief system design basis records found" message="No records match this company/site/unit/equipment scope. Create a relief basis or adjust filters." action={<PsiButton href={createHref}>Create Relief Basis</PsiButton>} /> : <><ReliefSystemTable rows={query.data.rows} /><ReliefSystemMobileCards rows={query.data.rows} /></>}
    </div>
  );
}
