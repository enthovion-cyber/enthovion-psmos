'use client';

import { useState } from 'react';
import { useMaterialCompatibility } from '../hooks/useMaterialCompatibility';
import { PsiButton, PsiEmptyState, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { MaterialCompatibilityFilters } from './MaterialCompatibilityFilters';
import { MaterialCompatibilityHeader } from './MaterialCompatibilityHeader';
import { MaterialCompatibilityMobileCards } from './MaterialCompatibilityMobileCards';
import { MaterialCompatibilitySummaryCards } from './MaterialCompatibilitySummaryCards';
import { MaterialCompatibilityTable } from './MaterialCompatibilityTable';

export function MaterialCompatibilityRegistryPage({ unitId, equipmentId, chemicalId, preset }: { unitId?: string; equipmentId?: string; chemicalId?: string; preset?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...(preset ?? {}) });
  const query = useMaterialCompatibility(filters, unitId, equipmentId, chemicalId);
  if (query.isLoading) return <PsiLoadingState rows={8} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  const createHref = unitId ? `/process-safety-information/units/${unitId}/material-compatibility/new` : '/process-safety-information/material-compatibility/new';
  return (
    <div className="space-y-5">
      <MaterialCompatibilityHeader lastUpdated={query.data.lastUpdated} unitId={unitId} />
      <MaterialCompatibilitySummaryCards summary={query.data.summary} />
      <MaterialCompatibilityFilters filters={filters} onChange={setFilters} savedViews={query.data.savedViews} />
      {!query.data.rows.length ? <PsiEmptyState title="No material compatibility records found" message="No chemical/material compatibility records match the current company, site, unit, equipment, chemical, and filter scope." action={<PsiButton href={createHref}>Create Compatibility Record</PsiButton>} /> : <><MaterialCompatibilityTable rows={query.data.rows} /><MaterialCompatibilityMobileCards rows={query.data.rows} /></>}
    </div>
  );
}

