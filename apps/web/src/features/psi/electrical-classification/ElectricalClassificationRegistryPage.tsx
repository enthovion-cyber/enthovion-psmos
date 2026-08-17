'use client';

import { useState } from 'react';
import { useElectricalClassifications } from '../hooks/useElectricalClassifications';
import { PsiButton, PsiEmptyState, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { ElectricalClassificationFilters } from './ElectricalClassificationFilters';
import { ElectricalClassificationHeader } from './ElectricalClassificationHeader';
import { ElectricalClassificationMobileCards } from './ElectricalClassificationMobileCards';
import { ElectricalClassificationSummaryCards } from './ElectricalClassificationSummaryCards';
import { ElectricalClassificationTable } from './ElectricalClassificationTable';

export function ElectricalClassificationRegistryPage({ unitId, areaId, equipmentId, preset }: { unitId?: string; areaId?: string; equipmentId?: string; preset?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...(preset ?? {}) });
  const query = useElectricalClassifications(filters, unitId, areaId, equipmentId);
  if (query.isLoading) return <PsiLoadingState rows={8} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  const createHref = unitId ? `/process-safety-information/units/${unitId}/electrical-classification/new` : '/process-safety-information/electrical-classification/new';
  return (
    <div className="space-y-5">
      <ElectricalClassificationHeader lastUpdated={query.data.lastUpdated} unitId={unitId} />
      <ElectricalClassificationSummaryCards summary={query.data.summary} />
      <ElectricalClassificationFilters filters={filters} onChange={setFilters} savedViews={query.data.savedViews} />
      {!query.data.rows.length ? <PsiEmptyState title="No electrical classifications found" message="No hazardous-area or electrical classification records match the current tenant/site/unit scope and filters." action={<PsiButton href={createHref}>Create Classification</PsiButton>} /> : <><ElectricalClassificationTable rows={query.data.rows} /><ElectricalClassificationMobileCards rows={query.data.rows} /></>}
    </div>
  );
}
