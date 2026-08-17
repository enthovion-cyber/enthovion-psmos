'use client';

import { useState } from 'react';
import { useDeficiencies, useDeficiencyLookups } from '../hooks/useDeficiencies';
import { useDeviations } from '../hooks/useDeviations';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { CriticalDeficiencyPanel, DeviationExpiryPanel, OverdueDeficiencyPanel, StartupBlockerPanel } from './DeficiencyAttentionPanels';
import { DeficiencyDashboardHeader } from './DeficiencyDashboardHeader';
import { DeficiencyFilters } from './DeficiencyFilters';
import { DeficiencyMobileCards } from './DeficiencyMobileCards';
import { DeficiencyRegisterTable } from './DeficiencyRegisterTable';
import { DeficiencySummaryCards } from './DeficiencySummaryCards';

export function DeficiencyDashboardPage({ initialFilters = {} }: { initialFilters?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, sort: 'updated_at.desc', ...initialFilters });
  const query = useDeficiencies(filters);
  const deviations = useDeviations(filters);
  const lookups = useDeficiencyLookups();
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load deficiency / deviation records. Check API availability, permissions, and company/site access.</div>;
  const data = query.data;
  return (
    <div className="space-y-5">
      <DeficiencyDashboardHeader lastUpdated={data?.lastUpdated} onRefresh={() => { void query.refetch(); void deviations.refetch(); }} />
      <DeficiencySummaryCards summary={data?.summary} />
      <div className="grid gap-5 xl:grid-cols-4">
        <div className="xl:col-span-2"><CriticalDeficiencyPanel rows={data?.rows} /></div>
        <OverdueDeficiencyPanel rows={data?.rows} />
        <StartupBlockerPanel rows={data?.rows} />
        <div className="xl:col-span-4"><DeviationExpiryPanel rows={deviations.data?.rows} /></div>
      </div>
      <DeficiencyFilters filters={filters} lookups={lookups.data} savedViews={data?.savedViews} onChange={setFilters} />
      <DeficiencyMobileCards rows={data?.rows} />
      <DeficiencyRegisterTable rows={data?.rows} />
    </div>
  );
}
