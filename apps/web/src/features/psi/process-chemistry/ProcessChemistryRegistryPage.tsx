'use client';

import { useState } from 'react';
import { useProcessChemistry } from '../hooks/useProcessChemistry';
import { PsiEmptyState, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { ProcessChemistryFilters } from './ProcessChemistryFilters';
import { ProcessChemistryHeader } from './ProcessChemistryHeader';
import { ProcessChemistryMobileCards } from './ProcessChemistryMobileCards';
import { ProcessChemistrySummaryCards } from './ProcessChemistrySummaryCards';
import { ProcessChemistryTable } from './ProcessChemistryTable';

export function ProcessChemistryRegistryPage({ unitId, preset }: { unitId?: string | undefined; preset?: Record<string, unknown> | undefined }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...(preset ?? {}) });
  const query = useProcessChemistry(filters, unitId);
  if (query.isLoading) return <PsiLoadingState rows={8} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  return (
    <div className="space-y-5">
      <ProcessChemistryHeader unitId={unitId} lastUpdated={query.data.lastUpdated} />
      <ProcessChemistrySummaryCards summary={query.data.summary} />
      <ProcessChemistryFilters filters={filters} onChange={setFilters} savedViews={query.data.savedViews} />
      {!query.data.rows.length ? <PsiEmptyState title="No process chemistry records found" message="No records match this company/site/unit scope and filters. Create a record or adjust filters." /> : <><ProcessChemistryTable rows={query.data.rows} /><ProcessChemistryMobileCards rows={query.data.rows} /></>}
    </div>
  );
}
