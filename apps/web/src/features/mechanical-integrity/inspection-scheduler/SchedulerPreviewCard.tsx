import type { MiInspectionScheduleEvaluation } from '../types/inspection-scheduler.types';
import { InspectionDueStatusBadge } from '../shared/InspectionDueStatusBadge';
import { SchedulerStatusBadge } from '../shared/SchedulerStatusBadge';

export function SchedulerPreviewCard({ evaluation }: { evaluation?: MiInspectionScheduleEvaluation | null }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h2 className="font-bold text-[var(--psm-text)]">Scheduler Preview</h2>{evaluation ? <div className="mt-3 flex flex-wrap gap-3"><InspectionDueStatusBadge value={evaluation.due_status} /><SchedulerStatusBadge value={evaluation.scheduler_status} /><span className="text-sm text-[var(--psm-text)]">Next due: {evaluation.final_next_due_date ?? 'Not scheduled'}</span></div> : <p className="mt-2 text-sm text-[var(--psm-muted)]">No preview selected.</p>}</div>;
}
