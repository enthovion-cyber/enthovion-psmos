'use client';

import Link from 'next/link';
import { TrainingButton, TrainingCard } from '../../shared/TrainingUi';
import { TrainingApprovalStatusBadge } from '../../shared/TrainingApprovalStatusBadge';
import { TrainingSessionStatusBadge } from '../../shared/TrainingSessionStatusBadge';
import type { TrainingSession } from '../../types/training-records.types';

export function TrainingSessionDetailHeader({ session }: { session: TrainingSession }) {
  return (
    <TrainingCard title={session.session_title} subtitle={`${session.session_code ?? 'No session code'} / ${session.training_title ?? session.training_item_id ?? 'Library link missing'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <TrainingSessionStatusBadge status={session.session_status} />
          <TrainingApprovalStatusBadge status={session.approval_status} />
          <span className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1 text-xs font-semibold">{session.siteName ?? session.site_id ?? 'Company scope'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <TrainingButton href={`/training-competency/training-records/sessions/${session.id}/attendance`} variant="secondary">Attendance</TrainingButton>
          <TrainingButton href={`/training-competency/training-records/sessions/${session.id}/edit`} variant="secondary">Edit</TrainingButton>
          <Link className="text-sm font-semibold text-primary" href="/training-competency/training-records/sessions">Back to sessions</Link>
        </div>
      </div>
    </TrainingCard>
  );
}
