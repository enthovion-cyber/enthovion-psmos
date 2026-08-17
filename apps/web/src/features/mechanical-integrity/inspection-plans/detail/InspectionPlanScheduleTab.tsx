import type { MiInspectionPlanDetail } from '../../types/inspection-plan.types';
import { InspectionDueStatusBadge } from '../../shared/InspectionDueStatusBadge';
import { SchedulerStatusBadge } from '../../shared/SchedulerStatusBadge';

export function InspectionPlanScheduleTab({ detail }: { detail: MiInspectionPlanDetail }) {
  const evaluation = detail.latestEvaluation ?? {};
  const schedule = detail.schedule ?? {};
  const rows: Array<[string, unknown]> = [
    ['Mode', schedule.scheduling_mode],
    ['Frequency', `${schedule.frequency_value ?? ''} ${schedule.frequency_unit ?? ''}`.trim()],
    ['Last inspection', schedule.last_inspection_date],
    ['Manual override', schedule.manual_override_due_date],
    ['Override reason', schedule.manual_override_reason]
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h2 className="font-bold text-[var(--psm-text)]">Scheduling Rule</h2><dl className="mt-3 space-y-2 text-sm">{rows.map(([k,v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-[var(--psm-muted)]">{k}</dt><dd className="font-semibold text-[var(--psm-text)]">{String(v || 'Not set')}</dd></div>)}</dl></div>
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h2 className="font-bold text-[var(--psm-text)]">Backend Evaluation</h2><div className="mt-3 grid gap-3"><InspectionDueStatusBadge value={String(evaluation.due_status ?? '')} /><SchedulerStatusBadge value={String(evaluation.scheduler_status ?? '')} /><div className="text-sm text-[var(--psm-text)]">Final next due: <strong>{String(evaluation.final_next_due_date ?? 'Not scheduled')}</strong></div><div className="text-sm text-[var(--psm-text)]">Governing CML: <strong>{String(evaluation.governing_cml_number ?? 'None')}</strong></div>{evaluation.scheduler_error ? <div className="rounded-lg bg-warning/10 p-2 text-sm text-warning">{String(evaluation.scheduler_error)}</div> : null}</div></div>
    </div>
  );
}
