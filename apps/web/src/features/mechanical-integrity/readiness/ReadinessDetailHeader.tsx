'use client';

import Link from 'next/link';
import { FitnessForServiceBadge } from '../shared/FitnessForServiceBadge';
import { StartupBlockedBadge } from '../shared/StartupBlockedBadge';
import { ActionButton, PrimaryButton, cardValue } from '../safeguards/SafeguardUiPrimitives';
import { RunReadinessCheckButton } from './RunReadinessCheckButton';
import type { MiReadinessAssessment } from '../types/readiness.types';

type Props = {
  assessment: MiReadinessAssessment;
  assessmentId: string;
  disabled?: boolean;
  running?: boolean;
  submitting?: boolean;
  onRunCheck: () => void;
  onSubmit: () => void;
  onReview: () => void;
  onApprove: () => void;
  onReject: () => void;
  onOverride: () => void;
};

export function ReadinessDetailHeader({ assessment, assessmentId, disabled, running, submitting, onRunCheck, onSubmit, onReview, onApprove, onReject, onOverride }: Props) {
  const disabledReason = disabled ? 'This assessment is locked/read-only.' : undefined;
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Readiness Assessment</p>
          <h1 className="mt-1 text-2xl font-bold">{assessment.assessment_number}</h1>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">{cardValue(assessment.equipment_tag ?? assessment.equipment_id)} | {assessment.assessment_reason}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <FitnessForServiceBadge decision={assessment.approved_decision ?? assessment.proposed_decision ?? assessment.recommended_decision} />
            <StartupBlockedBadge blocked={assessment.startup_blocked} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <RunReadinessCheckButton onRun={onRunCheck} disabled={Boolean(disabled)} pending={running} />
          <PrimaryButton onClick={onSubmit} disabled={Boolean(disabled) || submitting} title={disabledReason}>{submitting ? 'Submitting...' : 'Submit'}</PrimaryButton>
          <ActionButton onClick={onReview} disabled={Boolean(disabled)} title={disabledReason}>Start Review</ActionButton>
          <ActionButton onClick={onApprove} disabled={Boolean(disabled)} title={disabledReason}>Approve</ActionButton>
          <ActionButton onClick={onReject} disabled={Boolean(disabled)} title={disabledReason}>Reject</ActionButton>
          <ActionButton onClick={onOverride} disabled={Boolean(disabled)} title={disabledReason}>Override</ActionButton>
          <Link href={`/mechanical-integrity/readiness/assessments/${assessmentId}/edit`}><ActionButton disabled={Boolean(disabled)} title={disabledReason}>Edit</ActionButton></Link>
        </div>
      </div>
    </header>
  );
}
