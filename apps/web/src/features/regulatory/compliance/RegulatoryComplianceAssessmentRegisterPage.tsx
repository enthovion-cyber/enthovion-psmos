'use client';

import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryComplianceAssessments } from '../hooks/useRegulatoryComplianceAssessments';
import { useRegulatoryComplianceLookups } from '../hooks/useRegulatoryComplianceLookups';
import { RegulatoryComplianceAssessmentMobileCards } from './RegulatoryComplianceAssessmentMobileCards';
import { RegulatoryComplianceAssessmentTable } from './RegulatoryComplianceAssessmentTable';
import { RegulatoryComplianceFilters } from './RegulatoryComplianceFilters';
import { RegulatoryComplianceSummaryCards } from './RegulatoryComplianceSummaryCards';

export function RegulatoryComplianceAssessmentRegisterPage({ view, initialFilters }: { view?: string | undefined; initialFilters?: Record<string, unknown> | undefined }) {
  const [filters, setFilters] = useState<Record<string, unknown>>({ page: 1, limit: 25, ...(initialFilters ?? {}) });
  const query = useRegulatoryComplianceAssessments(filters, view);
  const lookups = useRegulatoryComplianceLookups();
  if (query.isLoading) return <RegulatoryLayout current="Compliance Status"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Compliance Status"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Compliance Status">
      <div className="space-y-5">
        <RegulatoryHeader title={view ? `Compliance Status - ${view}` : 'Compliance Assessment Register'} subtitle="Server-side scoped compliance assessments for regulatory items and obligations." onRefresh={() => query.refetch()} action={<RegulatoryButton href="/regulatory/compliance-status/assessments/new">New Assessment</RegulatoryButton>} />
        <RegulatoryComplianceSummaryCards summary={query.data?.summary} />
        <RegulatoryComplianceFilters filters={filters} setFilters={setFilters} lookups={lookups.data} onRefresh={() => query.refetch()} />
        <RegulatoryComplianceAssessmentTable rows={query.data?.rows} />
        <RegulatoryComplianceAssessmentMobileCards rows={query.data?.rows} />
      </div>
    </RegulatoryLayout>
  );
}
