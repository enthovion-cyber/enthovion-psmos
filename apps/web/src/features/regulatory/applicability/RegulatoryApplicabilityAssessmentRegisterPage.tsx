'use client';
import { useState } from 'react';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryButton, RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState, regulatoryInputClass } from '../shared/RegulatoryUi';
import { useRegulatoryApplicabilityAssessments } from '../hooks/useRegulatoryApplicabilityAssessments';
import { RegulatoryApplicabilityAssessmentTable } from './RegulatoryApplicabilityAssessmentTable';

export function RegulatoryApplicabilityAssessmentRegisterPage({ view }: { view?: string }) {
  const [search, setSearch] = useState('');
  const query = useRegulatoryApplicabilityAssessments({ search }, view);
  return (
    <RegulatoryLayout current="Applicability Assessments">
      <div className="space-y-5">
        <RegulatoryHeader title="Applicability Assessments" subtitle="Assessment register with backend decisions, rationale, scope, review status, stale states and gaps." action={<RegulatoryButton href="/regulatory/applicability/assessments/new">New Assessment</RegulatoryButton>} />
        <RegulatoryCard title="Filters / Search"><input className={regulatoryInputClass()} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search assessments..." /></RegulatoryCard>
        {query.isLoading ? <RegulatoryLoadingState /> : query.isError ? <RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /> : <RegulatoryApplicabilityAssessmentTable rows={query.data?.rows} />}
      </div>
    </RegulatoryLayout>
  );
}
