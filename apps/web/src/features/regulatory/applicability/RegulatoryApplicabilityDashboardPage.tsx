'use client';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryApplicabilityDashboard } from '../hooks/useRegulatoryApplicabilityDashboard';
import { RegulatoryApplicabilitySummaryCards } from './RegulatoryApplicabilitySummaryCards';
import { RegulatoryApplicabilityAssessmentTable } from './RegulatoryApplicabilityAssessmentTable';
import { RegulatoryApplicabilityGapTable } from './RegulatoryApplicabilityGapTable';

export function RegulatoryApplicabilityDashboardPage() {
  const query = useRegulatoryApplicabilityDashboard();
  if (query.isLoading) return <RegulatoryLayout current="Applicability Dashboard"><RegulatoryLoadingState /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Applicability Dashboard"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  return (
    <RegulatoryLayout current="Applicability Dashboard">
      <div className="space-y-5">
        <RegulatoryHeader title="Regulatory Applicability" subtitle="Backend-generated assessment dashboard, gaps, stale states, and rationale readiness." action={<RegulatoryButton href="/regulatory/applicability/assessments/new">New Assessment</RegulatoryButton>} />
        <RegulatoryApplicabilitySummaryCards summary={query.data?.summary} />
        <RegulatoryCard title="Stale Applicability" subtitle="Stale decisions cannot be treated as current until reassessed."><RegulatoryApplicabilityAssessmentTable rows={query.data?.staleAssessments} /></RegulatoryCard>
        <RegulatoryCard title="Open Applicability Gaps"><RegulatoryApplicabilityGapTable rows={query.data?.openGaps} /></RegulatoryCard>
      </div>
    </RegulatoryLayout>
  );
}
