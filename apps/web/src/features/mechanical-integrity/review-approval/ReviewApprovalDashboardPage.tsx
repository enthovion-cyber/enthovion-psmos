'use client';

import { useState } from 'react';
import { useReviewApprovalLookups, useReviewApprovals, type ReviewApprovalView } from '../hooks/useReviewApprovals';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { ApprovalFilters } from './ApprovalFilters';
import { ApprovalMobileCards } from './ApprovalMobileCards';
import { ApprovalTable } from './ApprovalTable';
import { EscalatedApprovalPanel } from './EscalatedApprovalPanel';
import { MyApprovalInbox } from './MyApprovalInbox';
import { OverdueApprovalPanel } from './OverdueApprovalPanel';
import { PendingApprovalPanel } from './PendingApprovalPanel';
import { ReviewApprovalHeader } from './ReviewApprovalHeader';
import { ReviewApprovalSummaryCards } from './ReviewApprovalSummaryCards';

export function ReviewApprovalDashboardPage({ initialFilters = {}, view = 'dashboard' }: { initialFilters?: Record<string, unknown>; view?: ReviewApprovalView }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, sort: 'updated_at.desc', ...initialFilters });
  const query = useReviewApprovals(filters, view);
  const lookups = useReviewApprovalLookups();
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load MI approvals. Check permissions, site access, migrations, and API availability.</div>;
  const rows = query.data?.rows ?? [];
  return (
    <div className="space-y-5">
      <ReviewApprovalHeader lastUpdated={query.data?.lastUpdated} onRefresh={() => void query.refetch()} />
      <ReviewApprovalSummaryCards summary={query.data?.summary} />
      <div className="grid gap-5 xl:grid-cols-3">
        <MyApprovalInbox rows={rows} />
        <PendingApprovalPanel rows={rows} />
        <OverdueApprovalPanel rows={rows} />
      </div>
      <EscalatedApprovalPanel rows={rows} />
      <ApprovalFilters filters={filters} lookups={lookups.data} savedViews={query.data?.savedViews} onChange={setFilters} />
      <ApprovalMobileCards rows={rows} />
      <ApprovalTable rows={rows} />
    </div>
  );
}
