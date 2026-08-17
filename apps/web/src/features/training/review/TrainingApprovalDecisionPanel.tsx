'use client';
import { TrainingButton, TrainingCard, TrainingErrorState } from '../shared/TrainingUi';
import { useTrainingApprovalMutations } from '../hooks/useTrainingApprovalMutations';

export function TrainingApprovalDecisionPanel({ approvalId, actions }: { approvalId: string; actions?: Array<{ key: string; label: string; enabled: boolean; disabledReason?: string | null }> | undefined }) {
  const mutations = useTrainingApprovalMutations(approvalId);
  const busy = Object.values(mutations).some((m: any) => m.isPending);
  const error = Object.values(mutations).find((m: any) => m.isError) as any;
  const action = (key: string) => actions?.find((a) => a.key === key);
  const ask = (label: string, fallback: string) => window.prompt(label, fallback) ?? fallback;
  return <TrainingCard title="Decision Actions" subtitle="Backend enforces stale, validation, permission, safety-critical and e-signature rules.">{error ? <TrainingErrorState message={error.error} /> : null}<div className="flex flex-wrap gap-2">
    <TrainingButton disabled={busy || !action('validate')?.enabled} title={action('validate')?.disabledReason ?? 'Run backend validation'} onClick={() => mutations.validate.mutate({ validationType: 'Manual' })}>Validate</TrainingButton>
    <TrainingButton disabled={busy || !action('approve')?.enabled} title={action('approve')?.disabledReason ?? 'Approve package'} onClick={() => mutations.approve.mutate({ reason: ask('Approval comment', 'Approved from Training Review & Approval.') })}>Approve</TrainingButton>
    <TrainingButton disabled={busy || !action('approve-conditions')?.enabled} title={action('approve-conditions')?.disabledReason ?? 'Condition/action is required'} onClick={() => mutations.approveWithConditions.mutate({ condition: ask('Approval condition/action', 'Complete condition action before use.') })}>Approve With Conditions</TrainingButton>
    <TrainingButton variant="danger" disabled={busy || !action('reject')?.enabled} title={action('reject')?.disabledReason ?? 'Reject requires reason'} onClick={() => mutations.reject.mutate({ reason: ask('Reject reason', 'Rejected from Training Review & Approval.') })}>Reject</TrainingButton>
    <TrainingButton variant="secondary" disabled={busy || !action('return')?.enabled} title={action('return')?.disabledReason ?? 'Return requires reason'} onClick={() => mutations.returnForCorrection.mutate({ reason: ask('Return reason', 'Returned for correction.') })}>Return</TrainingButton>
    <TrainingButton variant="secondary" disabled={busy || !action('escalate')?.enabled} title={action('escalate')?.disabledReason ?? 'Escalate requires permission'} onClick={() => mutations.escalate.mutate({ reason: ask('Escalation reason', 'Escalated from Training Review & Approval.') })}>Escalate</TrainingButton>
    <TrainingButton variant="secondary" disabled={busy || !action('reassign')?.enabled} title={action('reassign')?.disabledReason ?? 'Reassign requires reviewer'} onClick={() => mutations.reassign.mutate({ userId: ask('Reviewer user ID', '') })}>Reassign</TrainingButton>
    <TrainingButton variant="secondary" disabled={busy || !action('cancel')?.enabled} title={action('cancel')?.disabledReason ?? 'Cancel requires reason'} onClick={() => mutations.cancel.mutate({ reason: ask('Cancel reason', 'Cancelled from Training Review & Approval.') })}>Cancel</TrainingButton>
  </div></TrainingCard>;
}
