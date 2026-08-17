'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCriticalityRegistry } from '../hooks/useCriticalityRegistry';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { CriticalityFilters } from './CriticalityFilters';
import { CriticalityHeader } from './CriticalityHeader';
import { CriticalityMobileCards } from './CriticalityMobileCards';
import { CriticalityReviewQueue } from './CriticalityReviewQueue';
import { CriticalitySavedViews } from './CriticalitySavedViews';
import { CriticalitySummaryCards } from './CriticalitySummaryCards';
import { CriticalityTable } from './CriticalityTable';

export function CriticalityRegistryPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const query = useCriticalityRegistry(filters);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Criticality registry could not be loaded.</div>;
  return (
    <div className="space-y-5">
      <CriticalityHeader onNew={() => router.push('/mechanical-integrity/criticality/assessments/new')} onConfig={() => router.push('/mechanical-integrity/criticality/config')} onExport={() => window.open('/api/v1/mechanical-integrity/criticality/export', '_blank')} />
      <CriticalitySummaryCards summary={query.data.summary} />
      <CriticalitySavedViews onSelect={setFilters} />
      <CriticalityFilters filters={filters} onChange={setFilters} />
      <CriticalityReviewQueue rows={query.data.rows} onOpen={(row) => router.push(`/mechanical-integrity/criticality/assessments/${row.id}`)} />
      <CriticalityTable rows={query.data.rows} onOpen={(row) => router.push(`/mechanical-integrity/criticality/assessments/${row.id}`)} />
      <CriticalityMobileCards rows={query.data.rows} onOpen={(row) => router.push(`/mechanical-integrity/criticality/assessments/${row.id}`)} />
    </div>
  );
}
