'use client';

import { useState } from 'react';
import { usePsiChemicals } from '../hooks/usePsiChemicals';
import { PsiEmptyState, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiChemicalFilters } from './PsiChemicalFilters';
import { PsiChemicalHeader } from './PsiChemicalHeader';
import { PsiChemicalMobileCards } from './PsiChemicalMobileCards';
import { PsiChemicalSummaryCards } from './PsiChemicalSummaryCards';
import { PsiChemicalTable } from './PsiChemicalTable';

export function PsiChemicalRegistryPage({ unitId, preset }: { unitId?: string | undefined; preset?: Record<string, unknown> | undefined }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...(preset ?? {}) });
  const query = usePsiChemicals(filters, unitId);
  if (query.isLoading) return <PsiLoadingState rows={7} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  return (
    <div className="space-y-5">
      <PsiChemicalHeader unitId={unitId} lastUpdated={query.data.lastUpdated} />
      <PsiChemicalSummaryCards summary={query.data.summary} />
      <PsiChemicalFilters filters={filters} onChange={setFilters} savedViews={query.data.savedViews} />
      {!query.data.rows.length ? <PsiEmptyState title="No chemicals found" message="No chemical records match this company/site/unit scope and filter. Add a chemical or adjust filters." /> : <><PsiChemicalTable rows={query.data.rows} /><PsiChemicalMobileCards rows={query.data.rows} /></>}
    </div>
  );
}
