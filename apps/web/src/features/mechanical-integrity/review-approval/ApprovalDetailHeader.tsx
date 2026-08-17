'use client';

import Link from 'next/link';
import { ApprovalPriorityBadge } from '../shared/ApprovalPriorityBadge';
import { ApprovalStageBadge } from '../shared/ApprovalStageBadge';
import { ApprovalStatusBadge } from '../shared/ApprovalStatusBadge';
import { ESignatureRequiredBadge } from '../shared/ESignatureRequiredBadge';
import { SafetyCriticalBadge } from '../shared/SafetyCriticalBadge';
import { ValidationStatusBadge } from '../shared/ValidationStatusBadge';
import { ReviewButton } from './ReviewApprovalPrimitives';
import type { MiApprovalInstance } from '../types/review-approval.types';

export function ApprovalDetailHeader({ approval, readOnly, onRefresh, onValidate }: { approval: MiApprovalInstance; readOnly?: boolean; onRefresh: () => void; onValidate: () => void }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--psm-muted)]">MI Approval Package</p>
          <h1 className="mt-1 text-2xl font-bold">{approval.approval_number}</h1>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">{approval.source_module} - {approval.source_record_number ?? approval.source_record_id}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ApprovalStatusBadge status={approval.status} />
            <ApprovalStageBadge stage={approval.current_stage} />
            <ApprovalPriorityBadge priority={approval.priority} />
            <ValidationStatusBadge status={approval.last_validation_status} />
            <ESignatureRequiredBadge required={approval.e_signature_required} />
            <SafetyCriticalBadge value={approval.safety_critical} />
          </div>
          {readOnly ? <p className="mt-3 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">This approval is complete or locked. Records are read-only except through controlled revision workflow.</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/mechanical-integrity/review-approval"><ReviewButton>Back to Dashboard</ReviewButton></Link>
          <ReviewButton onClick={onValidate}>Run Validations</ReviewButton>
          <ReviewButton onClick={onRefresh} variant="primary">Refresh</ReviewButton>
        </div>
      </div>
    </header>
  );
}
