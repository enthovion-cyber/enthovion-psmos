'use client';

import type { MiInspectionPlanDetail } from '../../types/inspection-plan.types';
import { InspectionDueStatusBadge } from '../../shared/InspectionDueStatusBadge';
import { InspectionPlanStatusBadge } from '../../shared/InspectionPlanStatusBadge';
import { ScheduleBasisBadge } from '../../shared/ScheduleBasisBadge';
import { SchedulerStatusBadge } from '../../shared/SchedulerStatusBadge';

export function InspectionPlanDetailHeader({ detail, onAction, busy }: { detail: MiInspectionPlanDetail; onAction: (key: string) => void; busy?: boolean }) {
  const plan = detail.plan;
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--psm-muted)]">{plan.planNumber ?? plan.plan_number}</div>
          <h1 className="mt-1 text-2xl font-black text-[var(--psm-text)]">{plan.planTitle ?? plan.plan_title}</h1>
          <div className="mt-3 flex flex-wrap gap-2"><InspectionPlanStatusBadge value={plan.status} /><InspectionDueStatusBadge value={plan.dueStatus ?? plan.current_due_status} /><SchedulerStatusBadge value={plan.schedulerStatus ?? plan.current_scheduler_status} /><ScheduleBasisBadge value={plan.scheduleBasis ?? plan.current_due_basis} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['submit','approve','reject','run-scheduler','manual-override','archive','export'].map((key) => <button key={key} disabled={busy || detail.actions?.find((a) => a.key === key)?.disabled} title={detail.actions?.find((a) => a.key === key)?.disabledReason ?? undefined} onClick={() => onAction(key)} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)] disabled:cursor-not-allowed disabled:opacity-50">{key.replace('-', ' ')}</button>)}
        </div>
      </div>
    </div>
  );
}
