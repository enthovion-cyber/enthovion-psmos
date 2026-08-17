'use client';

import { RegulatoryLayout } from '../layout/RegulatoryLayout';
import { RegulatoryErrorState, RegulatoryLoadingState } from '../shared/RegulatoryUi';
import { useRegulatoryComplianceAssessmentDetail } from '../hooks/useRegulatoryComplianceAssessmentDetail';
import { ComplianceActionsTab } from './ComplianceActionsTab';
import { ComplianceAssessmentOverviewTab } from './ComplianceAssessmentOverviewTab';
import { ComplianceAssessmentSourceTab } from './ComplianceAssessmentSourceTab';
import { ComplianceDecisionTab } from './ComplianceDecisionTab';
import { ComplianceEvidenceReadinessTab } from './ComplianceEvidenceReadinessTab';
import { ComplianceGapsTab } from './ComplianceGapsTab';
import { ComplianceHistoryTab } from './ComplianceHistoryTab';
import { RegulatoryComplianceAssessmentHeader } from './RegulatoryComplianceAssessmentHeader';
import { RegulatoryComplianceStaleWarningPanel } from './RegulatoryComplianceStaleWarningPanel';

export function RegulatoryComplianceAssessmentDetailPage({ assessmentId, tab = 'overview' }: { assessmentId: string; tab?: string | undefined }) {
  const query = useRegulatoryComplianceAssessmentDetail(assessmentId);
  if (query.isLoading) return <RegulatoryLayout current="Compliance Status"><RegulatoryLoadingState rows={8} /></RegulatoryLayout>;
  if (query.isError) return <RegulatoryLayout current="Compliance Status"><RegulatoryErrorState message={query.error} onRetry={() => query.refetch()} /></RegulatoryLayout>;
  const detail = query.data;
  return (
    <RegulatoryLayout current="Compliance Status">
      <div className="space-y-5">
        <RegulatoryComplianceAssessmentHeader assessment={detail?.assessment} activeTab={tab} />
        <RegulatoryComplianceStaleWarningPanel assessment={detail?.assessment ?? null} />
        {tab === 'overview' ? <ComplianceAssessmentOverviewTab detail={detail} /> : null}
        {tab === 'source' ? <ComplianceAssessmentSourceTab detail={detail} /> : null}
        {tab === 'evidence-readiness' ? <ComplianceEvidenceReadinessTab detail={detail} /> : null}
        {tab === 'gaps' ? <ComplianceGapsTab detail={detail} /> : null}
        {tab === 'actions' ? <ComplianceActionsTab detail={detail} /> : null}
        {tab === 'decision' ? <ComplianceDecisionTab detail={detail} /> : null}
        {tab === 'history' ? <ComplianceHistoryTab detail={detail} /> : null}
      </div>
    </RegulatoryLayout>
  );
}
