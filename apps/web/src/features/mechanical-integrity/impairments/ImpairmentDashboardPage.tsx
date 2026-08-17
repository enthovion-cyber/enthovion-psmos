'use client';

import { useState } from 'react';
import { useImpairmentLookups, useImpairments } from '../hooks/useImpairments';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { ActiveImpairmentsPanel } from './ActiveImpairmentsPanel';
import { ExpiredImpairmentsPanel } from './ExpiredImpairmentsPanel';
import { ImpairmentBulkActions } from './ImpairmentBulkActions';
import { ImpairmentDashboardHeader } from './ImpairmentDashboardHeader';
import { ImpairmentFilters } from './ImpairmentFilters';
import { ImpairmentMobileCards } from './ImpairmentMobileCards';
import { ImpairmentRegisterTable } from './ImpairmentRegisterTable';
import { ImpairmentSummaryCards } from './ImpairmentSummaryCards';
import { PendingApprovalPanel } from './PendingApprovalPanel';

export function ImpairmentDashboardPage({ initialFilters = {} }: { initialFilters?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, sort: 'updated_at.desc', ...initialFilters });
  const query = useImpairments(filters);
  const lookups = useImpairmentLookups();
  if (query.isLoading) return <MiLoadingSkeleton rows={6} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load safeguard bypass / impairment records. Check API availability and permissions.</div>;
  const data = query.data;
  return (
    <div className="space-y-5">
      <ImpairmentDashboardHeader lastUpdated={data?.lastUpdated} />
      <ImpairmentSummaryCards summary={data?.summary} />
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2"><ActiveImpairmentsPanel rows={data?.rows} /></div>
        <div className="space-y-5">
          <ExpiredImpairmentsPanel rows={data?.rows} />
          <PendingApprovalPanel rows={data?.rows} />
        </div>
      </div>
      <ImpairmentFilters filters={filters} lookups={lookups.data} savedViews={data?.savedViews} onChange={setFilters} />
      <ImpairmentBulkActions />
      <ImpairmentMobileCards rows={data?.rows} />
      <ImpairmentRegisterTable rows={data?.rows} />
    </div>
  );
}
