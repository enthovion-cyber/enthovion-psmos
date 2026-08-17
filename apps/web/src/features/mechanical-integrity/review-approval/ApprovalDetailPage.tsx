'use client';

import { useApprovalDetail } from '../hooks/useApprovalDetail';
import { useApprovalMutations } from '../hooks/useApprovalMutations';
import { MiLoadingSkeleton } from '../shared/MiLoadingSkeleton';
import { ApprovalCommentsPanel } from './ApprovalCommentsPanel';
import { ApprovalConditionsPanel } from './ApprovalConditionsPanel';
import { ApprovalDecisionActions } from './ApprovalDecisionActions';
import { ApprovalDetailHeader } from './ApprovalDetailHeader';
import { ApprovalStageTimeline } from './ApprovalStageTimeline';
import { ChangeSummaryPanel } from './ChangeSummaryPanel';
import { ESignaturePanel } from './ESignaturePanel';
import { RequiredDocumentsReview } from './RequiredDocumentsReview';
import { RiskReadinessReviewCard } from './RiskReadinessReviewCard';
import { SourceRecordSummaryCard } from './SourceRecordSummaryCard';
import { ValidationChecklist } from './ValidationChecklist';

export function ApprovalDetailPage({ approvalId }: { approvalId: string }) {
  const query = useApprovalDetail(approvalId);
  const mutations = useApprovalMutations(approvalId);
  if (query.isLoading) return <MiLoadingSkeleton rows={8} />;
  if (query.isError || !query.data) return <div className="rounded-xl border border-danger/30 bg-danger/10 p-5 text-danger">Unable to load approval detail. Check approval ID, permissions, and site access.</div>;
  const detail = query.data;
  return (
    <div className="space-y-5">
      <ApprovalDetailHeader approval={detail.approval} readOnly={detail.readOnly} onRefresh={() => void query.refetch()} onValidate={() => mutations.runValidations.mutate()} />
      <div className="grid gap-5 xl:grid-cols-2">
        <SourceRecordSummaryCard detail={detail} />
        <RiskReadinessReviewCard approval={detail.approval} />
      </div>
      <ValidationChecklist validations={detail.validations} />
      <ApprovalDecisionActions detail={detail} actions={{
        approve: (input) => mutations.approve.mutate(input),
        reject: (input) => mutations.reject.mutate(input),
        returnForCorrection: (input) => mutations.returnForCorrection.mutate(input),
        delegate: (input) => mutations.delegate.mutate(input),
        escalate: (input) => mutations.escalate.mutate(input),
        requestInfo: (input) => mutations.requestInfo.mutate(input)
      }} />
      <div className="grid gap-5 xl:grid-cols-2">
        <ApprovalStageTimeline stages={detail.stages} />
        <RequiredDocumentsReview documents={detail.documents} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <ApprovalCommentsPanel comments={detail.comments} disabled={detail.readOnly} onAdd={(input) => mutations.addComment.mutate(input)} />
        <ApprovalConditionsPanel conditions={detail.conditions} disabled={detail.readOnly} onAdd={(input) => mutations.addCondition.mutate(input)} />
      </div>
      <ESignaturePanel detail={detail} />
      <ChangeSummaryPanel snapshots={detail.changeSummary} />
    </div>
  );
}
