import { ApprovalStageBadge } from '../shared/ApprovalStageBadge';
import { ApprovalStatusBadge } from '../shared/ApprovalStatusBadge';
import { ReviewCard, EmptyPanel } from './ReviewApprovalPrimitives';
import type { MiApprovalStage } from '../types/review-approval.types';

export function ApprovalStageTimeline({ stages }: { stages?: MiApprovalStage[] }) {
  return (
    <ReviewCard title="Approval Stage Timeline" description="Workflow Engine route, sequencing, delegated approvers, due dates, and e-signature references.">
      {!stages?.length ? <EmptyPanel>No approval stages have been generated.</EmptyPanel> : (
        <ol className="space-y-3">
          {stages.map((stage) => (
            <li key={stage.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Stage {stage.stage_number}: {stage.stage_name}</p>
                  <p className="text-sm text-[var(--psm-muted)]">Approver {stage.approver_user_id ?? stage.approver_role ?? 'Role based'}{stage.delegated_to_user_id ? `, delegated to ${stage.delegated_to_user_id}` : ''}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ApprovalStageBadge stage={stage.stage_name} />
                  <ApprovalStatusBadge status={stage.status} />
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--psm-muted)]">Due {stage.due_at ?? 'not configured'} - Action {stage.action ?? 'pending'} - E-signature {stage.e_signature_id ?? 'none'}</p>
            </li>
          ))}
        </ol>
      )}
    </ReviewCard>
  );
}
