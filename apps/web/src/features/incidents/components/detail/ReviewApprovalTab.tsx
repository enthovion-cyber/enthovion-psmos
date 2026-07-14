'use client';

import { useState } from 'react';
import { AddEditReviewerDrawer } from '../review-approval/AddEditReviewerDrawer';
import { ApprovalWorkflowPanel } from '../review-approval/ApprovalWorkflowPanel';
import { BlockersOpenItemsPanel } from '../review-approval/BlockersOpenItemsPanel';
import { ChangeRequestReworkPanel } from '../review-approval/ChangeRequestReworkPanel';
import { ClosureDecisionPanel } from '../review-approval/ClosureDecisionPanel';
import { ESignaturePanel } from '../review-approval/ESignaturePanel';
import { InvestigationReadinessGatePanel } from '../review-approval/InvestigationReadinessGatePanel';
import { ReopenReapprovalControlPanel } from '../review-approval/ReopenReapprovalControlPanel';
import { ReviewApprovalChangeHistoryPanel } from '../review-approval/ReviewApprovalChangeHistoryPanel';
import { ReviewApprovalHeader } from '../review-approval/ReviewApprovalHeader';
import { ReviewApprovalReadinessPanel } from '../review-approval/ReviewApprovalReadinessPanel';
import { ReviewApprovalSummaryCards } from '../review-approval/ReviewApprovalSummaryCards';
import { ReviewCommentsDecisionLogPanel } from '../review-approval/ReviewCommentsDecisionLogPanel';
import { ReviewersApproversRegister } from '../review-approval/ReviewersApproversRegister';
import { SectionCompletionChecklistPanel } from '../review-approval/SectionCompletionChecklistPanel';
import { TabStatePanel, errorText } from '../shared/IncidentTabPrimitives';
import { useIncidentReviewApproval, useIncidentReviewApprovalMutations } from '../../hooks/useIncidentReviewApproval';

export function ReviewApprovalTab({ incidentId }: { incidentId: string }) {
  const { data, isLoading, error, refetch } = useIncidentReviewApproval(incidentId);
  const mutations = useIncidentReviewApprovalMutations(incidentId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [message, setMessage] = useState<string | null>(null);
  const saving = Object.values(mutations).some((mutation: any) => mutation.isPending);

  if (isLoading) return <TabStatePanel title="Loading Review & Approval" message="Loading readiness, workflow, reviewers, e-signatures, blockers, closure status, and history from the backend." />;
  if (error) return <TabStatePanel title="Could not load Review & Approval" message={error instanceof Error ? error.message : 'The review approval API returned an error.'} tone="danger" />;
  if (!data) return <TabStatePanel title="No Review & Approval data" message="No data was returned for this incident." tone="danger" />;
  if (data.restricted) return <TabStatePanel title="Restricted review approval" message={data.lockedReason ?? 'You do not have permission to view Review & Approval.'} tone="danger" />;

  const set = (key: string, value: any) => setForm((current) => ({ ...current, [key]: value }));
  const addReviewer = () => {
    setForm({ required: true, eSignatureRequired: true, status: 'Pending assignment', approvalLevel: (data.reviewers?.length ?? 0) + 1 });
    setDrawerOpen(true);
  };
  const editReviewer = (row: any) => {
    setForm({
      id: row.id,
      reviewerUserId: row.reviewer_user_id,
      reviewerName: row.reviewer_name,
      reviewerEmail: row.reviewer_email,
      department: row.department,
      role: row.role,
      approvalLevel: row.approval_level,
      required: !!row.required,
      status: row.status,
      dueDate: row.due_date,
      eSignatureRequired: !!row.e_signature_required,
      comments: row.comments,
      reason: ''
    });
    setDrawerOpen(true);
  };
  const saveReviewer = async () => {
    try {
      if (form.id) await mutations.updateReviewer.mutateAsync({ reviewerId: form.id, values: form });
      else await mutations.createReviewer.mutateAsync(form);
      setDrawerOpen(false);
      setMessage('Reviewer / approver saved.');
    } catch (event) {
      setMessage(errorText(event));
    }
  };
  const reason = (label: string, fallback: string) => window.prompt(label) || fallback;
  const withReason = async (action: () => Promise<any>, success: string) => {
    try { await action(); setMessage(success); } catch (event) { setMessage(errorText(event)); }
  };
  const reviewerAction = (row: any, mutation: any, label: string, fallback: string, success: string, extras: Record<string, any> = {}) => withReason(
    () => mutation.mutateAsync({ reviewerId: row.id, values: { reason: reason(label, fallback), ...extras } }),
    success
  );

  const runReadiness = () => withReason(() => mutations.runReadinessCheck.mutateAsync({ reason: 'Readiness refreshed from Review & Approval tab' }), 'Readiness refreshed.');
  const startWorkflow = () => withReason(() => mutations.startWorkflow.mutateAsync({ reason: reason('Workflow start reason', 'Review workflow started') }), 'Review workflow started.');
  const requestClosure = () => withReason(() => mutations.requestClosure.mutateAsync({ reason: reason('Closure request reason', 'Closure requested from Review & Approval tab') }), 'Closure requested.');
  const closeIncident = () => withReason(() => mutations.closeIncident.mutateAsync({ reason: reason('Closure reason', 'Incident closed from Review & Approval tab') }), 'Incident closed.');
  const reopenIncident = () => withReason(() => mutations.reopenIncident.mutateAsync({ reason: reason('Reopen reason', 'Incident reopened from Review & Approval tab') }), 'Incident reopened.');
  const removeReviewer = (row: any) => withReason(() => mutations.removeReviewer.mutateAsync({ reviewerId: row.id, values: { reason: reason('Remove reviewer reason', 'Reviewer removed from workflow') } }), 'Reviewer removed.');
  const createChangeRequest = () => {
    const description = window.prompt('Change request description');
    if (!description) return;
    withReason(() => mutations.createChangeRequest.mutateAsync({ description, sourceSection: 'Review & Approval', reason: description }), 'Change request created.');
  };
  const resolveChangeRequest = (request: any) => withReason(() => mutations.resolveChangeRequest.mutateAsync({ requestId: request.id, values: { resolutionNotes: reason('Resolution notes', 'Resolved from Review & Approval tab') } }), 'Change request resolved.');
  const overrideBlocker = (blocker: any) => withReason(() => mutations.overrideBlocker.mutateAsync({ blockerId: blocker.id, values: { reason: reason('Exception / override reason', 'Accepted exception from Review & Approval tab') } }), 'Blocker exception accepted.');
  const eSign = (row: any) => withReason(() => mutations.eSign.mutateAsync({
    reviewerId: row.id,
    signatureMeaning: row.decision === 'Rejected' ? 'Rejected' : 'Approved',
    statement: reason('Signature statement', 'I electronically sign this review decision.'),
    reason: 'E-signature completed from Review & Approval tab'
  }), 'E-signature recorded.');

  return (
    <div className="grid gap-4">
      <ReviewApprovalHeader data={data} saving={saving} message={message} onRunReadiness={runReadiness} onStartWorkflow={startWorkflow} onAddReviewer={addReviewer} onRequestClosure={requestClosure} onClose={closeIncident} onReopen={reopenIncident} onRefresh={() => refetch()} />
      <ReviewApprovalSummaryCards cards={data.summaryCards ?? []} />
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <ReviewersApproversRegister rows={data.reviewers ?? []} onEdit={editReviewer} onRequest={(row: any) => reviewerAction(row, mutations.requestReviewer, 'Request message / reason', 'Review requested', 'Review request sent.')} onApprove={(row: any) => reviewerAction(row, mutations.approveReviewer, 'Approval comments', 'Approved from Review & Approval tab', 'Reviewer approved.')} onReject={(row: any) => reviewerAction(row, mutations.rejectReviewer, 'Rejection reason', 'Rejected from Review & Approval tab', 'Reviewer rejected.')} onRequestChanges={(row: any) => reviewerAction(row, mutations.requestReviewerChanges, 'Change request reason', 'Changes requested', 'Changes requested.')} onDelegate={(row: any) => reviewerAction(row, mutations.delegateReviewer, 'Delegate to user ID', 'Delegated from Review & Approval tab', 'Reviewer delegated.', { delegatedToUserId: window.prompt('Delegate to user ID') })} onEscalate={(row: any) => reviewerAction(row, mutations.escalateReviewer, 'Escalation reason', 'Escalated from Review & Approval tab', 'Reviewer escalated.')} onSign={eSign} onRemove={removeReviewer} />
        <ReviewApprovalReadinessPanel readiness={data.readiness} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <InvestigationReadinessGatePanel items={data.readinessGate ?? []} />
        <SectionCompletionChecklistPanel items={data.sectionChecklist ?? []} />
      </div>
      <ApprovalWorkflowPanel workflow={data.workflow} />
      <div className="grid gap-4 xl:grid-cols-2">
        <BlockersOpenItemsPanel blockers={data.blockers ?? []} onOverride={overrideBlocker} />
        <ChangeRequestReworkPanel requests={data.changeRequests ?? []} onCreate={createChangeRequest} onResolve={resolveChangeRequest} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ReviewCommentsDecisionLogPanel decisions={data.decisions ?? []} />
        <ESignaturePanel signatures={data.eSignatures ?? []} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ClosureDecisionPanel closure={data.closure} />
        <ReopenReapprovalControlPanel data={data.reopen} />
      </div>
      <ReviewApprovalChangeHistoryPanel rows={data.changeHistory ?? []} />
      <AddEditReviewerDrawer open={drawerOpen} form={form} set={set} saving={saving} onClose={() => setDrawerOpen(false)} onSave={saveReviewer} />
    </div>
  );
}
