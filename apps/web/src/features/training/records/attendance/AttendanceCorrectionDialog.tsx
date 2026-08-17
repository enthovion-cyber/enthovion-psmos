'use client';

import { TrainingCard } from '../../shared/TrainingUi';

export function AttendanceCorrectionDialog({ reason, onReasonChange }: { reason: string; onReasonChange: (value: string) => void }) {
  return (
    <TrainingCard title="Controlled Correction Reason" subtitle="Corrections after submission/lock require backend audit and immutable history.">
      <textarea className="min-h-20 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={reason} onChange={(e) => onReasonChange(e.target.value)} placeholder="Correction reason, who approved the correction, and supporting evidence reference" />
    </TrainingCard>
  );
}
