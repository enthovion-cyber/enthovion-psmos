'use client';

import { useState } from 'react';
import { useReadiness, useReadinessLookups } from '../hooks/useReadiness';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { FitWithRestrictionsPanel } from './FitWithRestrictionsPanel';
import { NotFitEquipmentPanel } from './NotFitEquipmentPanel';
import { ReadinessFilters } from './ReadinessFilters';
import { ReadinessHeader } from './ReadinessHeader';
import { ReadinessMobileCards } from './ReadinessMobileCards';
import { ReadinessSummaryCards } from './ReadinessSummaryCards';
import { ReadinessTable } from './ReadinessTable';
import { StartupBlockerPanel } from './StartupBlockerPanel';

export function ReadinessDashboardPage({ initialFilters = {} }: { initialFilters?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, sort: 'updated_at.desc', ...initialFilters });
  const query = useReadiness(filters);
  const lookups = useReadinessLookups();
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load MI readiness. Check API availability, permissions, and site access.</div>;
  const rows = query.data?.rows ?? [];
  const startup = rows.filter((row) => row.startup_blocked || row.recommended_decision === 'Startup Blocked' || row.approved_decision === 'Startup Blocked');
  const notFit = rows.filter((row) => row.recommended_decision === 'Not Fit for Service' || row.approved_decision === 'Not Fit for Service');
  const restricted = rows.filter((row) => /Restrictions|Deviation/.test(`${row.recommended_decision} ${row.approved_decision}`));
  return (
    <div className="space-y-5">
      <ReadinessHeader lastUpdated={query.data?.lastUpdated} onRefresh={() => void query.refetch()} />
      <ReadinessSummaryCards summary={query.data?.summary} />
      <div className="grid gap-5 xl:grid-cols-3">
        <StartupBlockerPanel rows={startup} />
        <NotFitEquipmentPanel rows={notFit} />
        <FitWithRestrictionsPanel rows={restricted} />
      </div>
      <ReadinessFilters filters={filters} lookups={lookups.data} savedViews={query.data?.savedViews} onChange={setFilters} />
      <ReadinessMobileCards rows={rows} />
      <ReadinessTable rows={rows} />
    </div>
  );
}
