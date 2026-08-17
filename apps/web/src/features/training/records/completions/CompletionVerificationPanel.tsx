'use client';

import { useState } from 'react';
import { TrainingButton, TrainingCard, TrainingErrorState } from '../../shared/TrainingUi';
import { TrainingApprovalStatusBadge } from '../../shared/TrainingApprovalStatusBadge';
import { TrainingVerificationStatusBadge } from '../../shared/TrainingVerificationStatusBadge';
import { useTrainingCompletionMutations } from '../../hooks/useTrainingCompletionMutations';

export function CompletionVerificationPanel({ record }: { record: Record<string, any> }) {
  const [reason, setReason] = useState('');
  const mutations = useTrainingCompletionMutations(record.id);
  const busy = mutations.verifyRecord.isPending || mutations.rejectRecord.isPending || mutations.approveRecord.isPending || mutations.reopenRecord.isPending || mutations.recalculateRecord.isPending;
  return (
    <TrainingCard title="Verification / Approval" subtitle="Verified and approved records lock through backend workflow; correction or reopen requires reason.">
      <div className="mb-4 flex flex-wrap gap-2">
        <TrainingVerificationStatusBadge status={record.verification_status} />
        <TrainingApprovalStatusBadge status={record.approval_status} />
      </div>
      <textarea className="min-h-20 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Reason, verification notes, rejection reason, or controlled correction reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        <TrainingButton onClick={() => mutations.verifyRecord.mutate({ reason })} disabled={busy} title={busy ? 'A verification action is already saving.' : 'Verify this completion record.'}>Verify</TrainingButton>
        <TrainingButton onClick={() => mutations.approveRecord.mutate({ reason })} disabled={busy} title={busy ? 'An approval action is already saving.' : 'Approve this completion record.'}>Approve</TrainingButton>
        <TrainingButton variant="danger" onClick={() => mutations.rejectRecord.mutate({ reason })} disabled={busy || !reason.trim()} title={!reason.trim() ? 'A rejection reason is required.' : busy ? 'A rejection action is already saving.' : 'Reject this completion record.'}>Reject</TrainingButton>
        <TrainingButton variant="secondary" onClick={() => mutations.reopenRecord.mutate({ reason })} disabled={busy || !reason.trim()} title={!reason.trim() ? 'A reopen/correction reason is required.' : busy ? 'A reopen action is already saving.' : 'Reopen for controlled correction.'}>Reopen</TrainingButton>
        <TrainingButton variant="secondary" onClick={() => mutations.recalculateRecord.mutate()} disabled={busy} title={busy ? 'Recalculation is already running.' : 'Ask backend to recalculate completion, matrix, competency and expiry status.'}>Recalculate status</TrainingButton>
      </div>
      {[mutations.verifyRecord.error, mutations.rejectRecord.error, mutations.approveRecord.error, mutations.reopenRecord.error, mutations.recalculateRecord.error].filter(Boolean).map((error, index) => <div className="mt-3" key={index}><TrainingErrorState message={error} /></div>)}
    </TrainingCard>
  );
}
