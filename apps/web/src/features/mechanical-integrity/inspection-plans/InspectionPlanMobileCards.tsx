'use client';

import type { MiInspectionPlan } from '../types/inspection-plan.types';
import { InspectionDueStatusBadge } from '../shared/InspectionDueStatusBadge';
import { InspectionPlanStatusBadge } from '../shared/InspectionPlanStatusBadge';

export function InspectionPlanMobileCards({ rows, onOpen }: { rows: MiInspectionPlan[]; onOpen: (row: MiInspectionPlan) => void }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => <button key={row.id} onClick={() => onOpen(row)} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 text-left">
        <div className="flex items-start justify-between gap-3"><div><div className="font-bold text-[var(--psm-text)]">{row.planTitle ?? row.plan_title}</div><div className="text-xs text-[var(--psm-muted)]">{row.planNumber ?? row.plan_number} - {row.equipmentTag}</div></div><InspectionPlanStatusBadge value={row.status} /></div>
        <div className="mt-3 flex items-center justify-between text-sm text-[var(--psm-text)]"><span>{row.nextDueDate ?? 'Not scheduled'}</span><InspectionDueStatusBadge value={row.dueStatus ?? row.current_due_status} /></div>
      </button>)}
    </div>
  );
}
