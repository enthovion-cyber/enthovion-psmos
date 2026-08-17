'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PsiSummaryCards } from '../dashboard/PsiSummaryCards';
import { usePsiUnitLookups, usePsiUnits } from '../hooks/usePsiUnits';
import { PsiButton, PsiEmptyState, PsiErrorState, PsiLoadingState } from '../shared/PsiUi';
import { PsiUnitFilters } from './PsiUnitFilters';
import { PsiUnitMobileCards } from './PsiUnitMobileCards';
import { PsiUnitTable } from './PsiUnitTable';

export function PsiUnitRegistryPage() {
  const searchParams = useSearchParams();
  const initial = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, sort: 'updated_at.desc', ...initial });
  const query = usePsiUnits(filters);
  const lookups = usePsiUnitLookups();
  if (query.isLoading) return <PsiLoadingState rows={8} />;
  if (query.isError) return <PsiErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  const data = query.data;
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Process Unit Registry</h1>
          <p className="text-sm text-[var(--psm-muted)]">Server-side registry for PSI process unit profiles and completeness readiness.</p>
        </div>
        <PsiButton href="/process-safety-information/units/new">Create Process Unit</PsiButton>
      </div>
      <PsiSummaryCards summary={data?.summary ?? undefined} />
      <PsiUnitFilters filters={filters} lookups={lookups.data ?? undefined} savedViews={data?.savedViews ?? []} onChange={setFilters} />
      {data?.rows.length ? <><PsiUnitMobileCards rows={data.rows} /><PsiUnitTable rows={data.rows} /></> : <PsiEmptyState title="No process units" message="Create the first PSI process unit profile for this site." action={<PsiButton href="/process-safety-information/units/new">Create Process Unit</PsiButton>} />}
    </div>
  );
}
