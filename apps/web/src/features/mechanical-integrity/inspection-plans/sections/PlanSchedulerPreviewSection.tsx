import type { MiInspectionScheduleEvaluation } from '../../types/inspection-scheduler.types';
import { InspectionDueStatusBadge } from '../../shared/InspectionDueStatusBadge';
import { ScheduleBasisBadge } from '../../shared/ScheduleBasisBadge';
import { SchedulerStatusBadge } from '../../shared/SchedulerStatusBadge';

export function PlanSchedulerPreviewSection({ evaluation }: { evaluation?: MiInspectionScheduleEvaluation | null }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-bold text-[var(--psm-text)]">Auto-Scheduler Preview</h2>
      {!evaluation ? <p className="mt-2 text-sm text-[var(--psm-muted)]">Save or preview the plan to show backend-generated schedule results.</p> : (
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <div><div className="text-xs text-[var(--psm-muted)]">Final next due</div><div className="font-bold text-[var(--psm-text)]">{evaluation.final_next_due_date ?? 'Not scheduled'}</div></div>
          <div><div className="text-xs text-[var(--psm-muted)]">Due status</div><InspectionDueStatusBadge value={evaluation.due_status} /></div>
          <div><div className="text-xs text-[var(--psm-muted)]">Scheduler</div><SchedulerStatusBadge value={evaluation.scheduler_status} /></div>
          <div><div className="text-xs text-[var(--psm-muted)]">Basis</div><ScheduleBasisBadge value={evaluation.final_due_basis} /></div>
          {evaluation.governing_cml_number ? <div className="md:col-span-2 text-sm text-[var(--psm-text)]">Governing CML/TML: <strong>{evaluation.governing_cml_number}</strong></div> : null}
          {evaluation.scheduler_error ? <div className="md:col-span-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{evaluation.scheduler_error}</div> : null}
        </div>
      )}
    </section>
  );
}
