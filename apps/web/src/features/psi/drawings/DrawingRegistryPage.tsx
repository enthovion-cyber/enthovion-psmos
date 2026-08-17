'use client';

import { useState } from 'react';
import { useDrawings } from '../hooks/useDrawings';
import { PsiButton, PsiEmptyState, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { DrawingFilters } from './DrawingFilters';
import { DrawingHeader } from './DrawingHeader';
import { DrawingMobileCards } from './DrawingMobileCards';
import { DrawingSummaryCards } from './DrawingSummaryCards';
import { DrawingTable } from './DrawingTable';

export function DrawingRegistryPage({ unitId, equipmentId, preset }: { unitId?: string | undefined; equipmentId?: string | undefined; preset?: Record<string, unknown> | undefined }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...(preset ?? {}) });
  const query = useDrawings(filters, unitId, equipmentId);
  if (query.isLoading) return <PsiLoadingState rows={8} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  const createHref = unitId ? `/process-safety-information/units/${unitId}/drawings/new` : '/process-safety-information/drawings/new';
  return (
    <div className="space-y-5">
      <DrawingHeader unitId={unitId} lastUpdated={query.data.lastUpdated} />
      <DrawingSummaryCards summary={query.data.summary} />
      <DrawingFilters filters={filters} onChange={setFilters} savedViews={query.data.savedViews} />
      {!query.data.rows.length ? <PsiEmptyState title="No drawings found" message="No current drawing records match this company/site/unit/equipment scope. Link an approved Document Control drawing or adjust filters." action={<PsiButton href={createHref}>Create Drawing</PsiButton>} /> : <><DrawingTable rows={query.data.rows} /><DrawingMobileCards rows={query.data.rows} /></>}
    </div>
  );
}
