'use client';

import { useMOCWorkflow } from '../../hooks/useMOCWorkflow';
import { useMOCWorkflowMutations } from '../../hooks/useMOCWorkflowMutations';
import { ErrorState, LoadingState } from '../moc-detail-ui';
import { ApprovalComments } from '../workflow/ApprovalComments';
import { ApproversTable } from '../workflow/ApproversTable';
import { CurrentApprovalStepPanel } from '../workflow/CurrentApprovalStepPanel';
import { MOCApprovalStepper } from '../workflow/MOCApprovalStepper';
import { MOCWorkflowSummaryCard } from '../workflow/MOCWorkflowSummaryCard';
import { WorkflowActionBar } from '../workflow/WorkflowActionBar';
import { WorkflowEscalationPanel } from '../workflow/WorkflowEscalationPanel';
import { WorkflowHistory } from '../workflow/WorkflowHistory';
import { SignatureMatrix } from '@/features/signatures/components/SignatureMatrix';

export function MOCApprovalWorkflowTab({ moc }: { moc: any }) {
  const workflow = useMOCWorkflow(moc.id);
  const mutations = useMOCWorkflowMutations(moc.id);
  if (workflow.isLoading) return <LoadingState />;
  if (workflow.isError) return <ErrorState message="Unable to load MOC approval workflow from Workflow Engine." />;
  const data = workflow.data;
  const readOnly = ['Closed', 'Cancelled'].includes(moc.status);
  return (
    <div className="space-y-6 w-full">
      <MOCWorkflowSummaryCard data={data} />
      <MOCApprovalStepper steps={data?.steps ?? []} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-full">
        <CurrentApprovalStepPanel data={data} />
        <WorkflowActionBar mutations={mutations} disabled={readOnly} />
      </div>
      <SignatureMatrix
        title="Universal MOC Approval Signatures"
        context={{
          moduleName: 'MOC',
          recordType: 'approval',
          recordId: moc.id,
          recordNumber: moc.moc_number ?? moc.mocNumber,
          actionType: 'approve'
        }}
      />
      <ApproversTable approvers={data?.approvers ?? []} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 w-full">
        <ApprovalComments comments={data?.comments ?? []} />
        <WorkflowEscalationPanel data={data} />
      </div>
      <WorkflowHistory history={data?.history ?? []} />
    </div>
  );
}
