'use client';
import { RegulatoryHeader } from '../RegulatoryHeader';
import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryCard, RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { RegulatoryApplicabilityStatusBadge } from '../shared/RegulatoryApplicabilityStatusBadge';
import { RegulatoryApplicabilityGapTable } from './RegulatoryApplicabilityGapTable';
import { useRegulatoryApplicabilityAssessmentDetail } from '../hooks/useRegulatoryApplicabilityAssessmentDetail';

export function RegulatoryApplicabilityAssessmentDetailPage({ assessmentId, section = 'overview' }: { assessmentId: string; section?: string }) {
  const query = useRegulatoryApplicabilityAssessmentDetail(assessmentId);
  if (query.isLoading) return <RegulatoryLayout current="Applicability Assessment"><RegulatoryLoadingState /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Applicability Assessment"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const detail = query.data;
  return <RegulatoryLayout current="Applicability Assessment"><div className="space-y-5"><RegulatoryHeader title={detail?.assessment.assessment_title ?? 'Applicability Assessment'} subtitle={`${detail?.assessment.assessment_number ?? assessmentId} / ${section}`} /><RegulatoryCard title="Decision Snapshot"><div className="flex flex-wrap gap-3"><RegulatoryApplicabilityStatusBadge status={detail?.assessment.applicability_status} /><span className="text-sm text-[var(--psm-muted)]">{detail?.assessment.rationale ?? 'Rationale not recorded.'}</span></div></RegulatoryCard><RegulatoryCard title="Readiness / Blockers"><pre className="whitespace-pre-wrap text-xs text-[var(--psm-muted)]">{JSON.stringify(detail?.readiness ?? {}, null, 2)}</pre></RegulatoryCard><RegulatoryCard title="Gaps"><RegulatoryApplicabilityGapTable rows={detail?.gaps} /></RegulatoryCard></div></RegulatoryLayout>;
}
