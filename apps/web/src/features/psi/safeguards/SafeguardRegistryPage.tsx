'use client';

import { useState } from 'react';
import { useSafeguards } from '../hooks/useSafeguards';
import { PsiButton, PsiEmptyState, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { SafeguardFilters } from './SafeguardFilters';
import { SafeguardHeader } from './SafeguardHeader';
import { SafeguardMobileCards } from './SafeguardMobileCards';
import { SafeguardSummaryCards } from './SafeguardSummaryCards';
import { SafeguardTable } from './SafeguardTable';

export function SafeguardRegistryPage({ unitId, equipmentId, preset }: { unitId?: string | undefined; equipmentId?: string | undefined; preset?: Record<string, unknown> | undefined }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...(preset ?? {}) });
  const query = useSafeguards(filters, unitId, equipmentId);
  if (query.isLoading) return <PsiLoadingState rows={8} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  const createHref = unitId ? `/process-safety-information/units/${unitId}/safeguards/new` : '/process-safety-information/safeguards/new';
  return <div className="space-y-5"><SafeguardHeader lastUpdated={query.data.lastUpdated} unitId={unitId} /><SafeguardSummaryCards summary={query.data.summary} /><SafeguardFilters filters={filters} onChange={setFilters} savedViews={query.data.savedViews} />{!query.data.rows.length ? <PsiEmptyState title="No safeguards / controls found" message="No safeguard/control records match the current company, site, unit, equipment, and filter scope." action={<PsiButton href={createHref}>Create Safeguard</PsiButton>} /> : <><SafeguardTable rows={query.data.rows} /><SafeguardMobileCards rows={query.data.rows} /></>}</div>;
}
