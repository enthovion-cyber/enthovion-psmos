'use client';

import { useState } from 'react';
import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { AuditErrorState, AuditLoadingState, AuditEmptyState, AuditButton } from '../shared/AuditUi';
import { useAuditDashboard } from '../hooks/useAuditDashboard';
import { AuditSummaryCards } from './AuditSummaryCards';
import { AuditProgramCoverageCharts } from './AuditProgramCoverageCharts';
import { AuditProgramGapPanels } from './AuditProgramGapPanels';
import { AuditRecentProgramsPanel } from './AuditRecentProgramsPanel';

export function AuditDashboardPage() {
  const [filters] = useState<Record<string, unknown>>({});
  const query = useAuditDashboard(filters);
  if (query.isLoading) return <AuditLayout><AuditLoadingState rows={8} /></AuditLayout>;
  if (query.isError) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const data = query.data ?? {};
  const empty = !Number(data.summary?.totalAuditPrograms ?? 0);
  return (
    <AuditLayout>
      <div className="space-y-6">
        <AuditHeader subtitle={data.header?.subtitle} />
        {empty ? <AuditEmptyState title="No audit programs yet" message="Create an audit program to begin tracking audit scope, standards, modules, frequency, ownership, and scheduling readiness." action={<AuditButton href="/audit-compliance/programs/new">Create Audit Program</AuditButton>} /> : null}
        <AuditSummaryCards summary={data.summary ?? {}} />
        <AuditProgramCoverageCharts moduleCoverage={data.moduleCoverage} statusBySite={data.statusBySite} standardCoverage={data.standardCoverage} />
        <AuditProgramGapPanels configurationGaps={data.configurationGaps} siteCoverageGaps={data.siteCoverageGaps} moduleCoverageGaps={data.moduleCoverageGaps} readyForScheduling={data.readyForScheduling} />
        <AuditRecentProgramsPanel created={data.recentlyCreatedPrograms} updated={data.recentlyUpdatedPrograms} safety={data.safetyCriticalPreview} regulatory={data.regulatoryCriticalPreview} />
      </div>
    </AuditLayout>
  );
}
