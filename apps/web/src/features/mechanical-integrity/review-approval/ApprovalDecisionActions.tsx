'use client';

import { useState } from 'react';
import { ReviewButton, ReviewCard } from './ReviewApprovalPrimitives';
import { ApproveDialog } from './dialogs/ApproveDialog';
import { DelegateDialog } from './dialogs/DelegateDialog';
import { EscalateDialog } from './dialogs/EscalateDialog';
import { RejectDialog } from './dialogs/RejectDialog';
import { ReturnForCorrectionDialog } from './dialogs/ReturnForCorrectionDialog';
import type { MiApprovalDetailResponse } from '../types/review-approval.types';

type DialogName = 'approve' | 'reject' | 'return' | 'delegate' | 'escalate' | null;

export function ApprovalDecisionActions({ detail, actions }: { detail: MiApprovalDetailResponse; actions: { approve: (input: Record<string, unknown>) => void; reject: (input: Record<string, unknown>) => void; returnForCorrection: (input: Record<string, unknown>) => void; delegate: (input: Record<string, unknown>) => void; escalate: (input: Record<string, unknown>) => void; requestInfo: (input: Record<string, unknown>) => void } }) {
  const [dialog, setDialog] = useState<DialogName>(null);
  const disabledReason = detail.readOnly ? 'Completed approvals are immutable.' : detail.permissionState?.disabledReason ?? undefined;
  const disabled = Boolean(disabledReason);
  return (
    <ReviewCard title="Decision Actions" description="Backend-controlled approve, reject, return, delegate, escalate, request-info, and conditional approval actions.">
      {disabledReason ? <div className="mb-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{disabledReason}</div> : null}
      <div className="flex flex-wrap gap-2">
        <ReviewButton variant="primary" disabled={disabled} title={disabledReason} onClick={() => setDialog('approve')}>Approve</ReviewButton>
        <ReviewButton disabled={disabled} title={disabledReason} onClick={() => setDialog('return')}>Return for Correction</ReviewButton>
        <ReviewButton disabled={disabled} title={disabledReason} onClick={() => actions.requestInfo({ comment: 'More information requested from approval detail page.' })}>Request Info</ReviewButton>
        <ReviewButton disabled={disabled} title={disabledReason} onClick={() => setDialog('delegate')}>Delegate</ReviewButton>
        <ReviewButton disabled={disabled} title={disabledReason} onClick={() => setDialog('escalate')}>Escalate</ReviewButton>
        <ReviewButton variant="danger" disabled={disabled} title={disabledReason} onClick={() => setDialog('reject')}>Reject</ReviewButton>
      </div>
      {dialog === 'approve' ? <ApproveDialog onClose={() => setDialog(null)} onSubmit={(input) => { actions.approve(input); setDialog(null); }} /> : null}
      {dialog === 'reject' ? <RejectDialog onClose={() => setDialog(null)} onSubmit={(input) => { actions.reject(input); setDialog(null); }} /> : null}
      {dialog === 'return' ? <ReturnForCorrectionDialog onClose={() => setDialog(null)} onSubmit={(input) => { actions.returnForCorrection(input); setDialog(null); }} /> : null}
      {dialog === 'delegate' ? <DelegateDialog onClose={() => setDialog(null)} onSubmit={(input) => { actions.delegate(input); setDialog(null); }} /> : null}
      {dialog === 'escalate' ? <EscalateDialog onClose={() => setDialog(null)} onSubmit={(input) => { actions.escalate(input); setDialog(null); }} /> : null}
    </ReviewCard>
  );
}
