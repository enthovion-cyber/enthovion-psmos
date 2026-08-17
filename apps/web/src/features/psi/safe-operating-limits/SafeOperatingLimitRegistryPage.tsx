'use client';

import { useState } from 'react';
import { useSafeOperatingLimits } from '../hooks/useSafeOperatingLimits';
import { PsiButton, PsiEmptyState, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { SafeOperatingLimitFilters } from './SafeOperatingLimitFilters';
import { SafeOperatingLimitHeader } from './SafeOperatingLimitHeader';
import { SafeOperatingLimitMobileCards } from './SafeOperatingLimitMobileCards';
import { SafeOperatingLimitSummaryCards } from './SafeOperatingLimitSummaryCards';
import { SafeOperatingLimitTable } from './SafeOperatingLimitTable';

export function SafeOperatingLimitRegistryPage({ unitId, equipmentId, preset }: { unitId?: string | undefined; equipmentId?: string | undefined; preset?: Record<string, unknown> | undefined }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...(preset ?? {}) });
  const query = useSafeOperatingLimits(filters, unitId, equipmentId);
  if (query.isLoading) return <PsiLoadingState rows={8} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  if (!query.data) return null;
  return (
    <div className="space-y-5">
      <SafeOperatingLimitHeader unitId={unitId} lastUpdated={query.data.lastUpdated} />
      <SafeOperatingLimitSummaryCards summary={query.data.summary} />
      <SafeOperatingLimitFilters filters={filters} onChange={setFilters} savedViews={query.data.savedViews} />
      {!query.data.rows.length ? <PsiEmptyState title="No safe operating limits found" message="No SOL records match this company/site/unit scope and filters. Create a SOL or adjust filters." action={<PsiButton href={unitId ? `/process-safety-information/units/${unitId}/safe-operating-limits/new` : '/process-safety-information/safe-operating-limits/new'}>Create SOL</PsiButton>} /> : <><SafeOperatingLimitTable rows={query.data.rows} /><SafeOperatingLimitMobileCards rows={query.data.rows} /></>}
    </div>
  );
}
