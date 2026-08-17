'use client';

import { TrainingCard, TrainingMetricCard, TrainingProgress } from '../../../shared/TrainingUi';
import type { TrainingSessionDetailResponse } from '../../../types/training-records.types';

export function SessionOverviewTab({ data }: { data: TrainingSessionDetailResponse }) {
  const summary = data.summary ?? {};
  const readiness = data.readiness ?? { status: 'Not Determined', blockers: [] };
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <TrainingMetricCard label="Roster" value={summary.rosterCount ?? data.roster.length} />
        <TrainingMetricCard label="Present" value={summary.present ?? data.attendance.filter((r) => r.attendance_status === 'Present').length} tone="good" />
        <TrainingMetricCard label="Completion records" value={summary.completionCount ?? data.completionRecords.length} />
        <TrainingMetricCard label="Missing evidence" value={summary.missingEvidence ?? 0} tone={summary.missingEvidence ? 'danger' : 'good'} />
      </div>
      <TrainingCard title="Readiness / Missing Data" subtitle="Backend-generated session readiness for attendance, evidence, completions, verification and approval.">
        <div className="mb-3 flex items-center justify-between text-sm"><b>{readiness.status}</b><span>{readiness.blockers?.length ?? 0} blockers</span></div>
        <TrainingProgress value={readiness.status === 'Complete' ? 100 : readiness.status === 'Warning' ? 70 : 35} />
        <ul className="mt-3 space-y-2 text-sm">{(readiness.blockers ?? []).map((b) => <li key={b.code} className="rounded-lg border border-warning/30 bg-warning/10 p-2 text-warning">{b.message}</li>)}</ul>
      </TrainingCard>
    </div>
  );
}
