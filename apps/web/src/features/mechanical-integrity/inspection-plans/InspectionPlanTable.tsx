'use client';

import type { MiInspectionPlan } from '../types/inspection-plan.types';
import { InspectionDueStatusBadge } from '../shared/InspectionDueStatusBadge';
import { InspectionMethodBadge } from '../shared/InspectionMethodBadge';
import { InspectionPlanStatusBadge } from '../shared/InspectionPlanStatusBadge';
import { ScheduleBasisBadge } from '../shared/ScheduleBasisBadge';
import { SchedulerStatusBadge } from '../shared/SchedulerStatusBadge';

export function InspectionPlanTable({ rows, onOpen, onEdit }: { rows: MiInspectionPlan[]; onOpen: (row: MiInspectionPlan) => void; onEdit: (row: MiInspectionPlan) => void }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-[var(--psm-muted)]">No inspection plans match the current filters.</div>;
  return (
    <div className="hidden overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm lg:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase tracking-wide text-[var(--psm-muted)]">
          <tr><th className="p-3">Plan</th><th className="p-3">Equipment</th><th className="p-3">Type / Method</th><th className="p-3">Status</th><th className="p-3">Schedule Basis</th><th className="p-3">Next Due</th><th className="p-3">Owner</th><th className="p-3">Revision</th><th className="p-3">Actions</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => <tr key={row.id} className="border-t border-[var(--psm-line)]">
            <td className="p-3 font-bold text-[var(--psm-text)]">{row.planNumber ?? row.plan_number}<div className="text-xs font-normal text-[var(--psm-muted)]">{row.planTitle ?? row.plan_title}</div></td>
            <td className="p-3 text-[var(--psm-text)]">{row.equipmentTag ?? row.equipment_id}<div className="text-xs text-[var(--psm-muted)]">{row.equipmentName ?? row.equipmentType ?? 'Equipment'}</div></td>
            <td className="p-3"><div className="font-semibold text-[var(--psm-text)]">{row.planType ?? row.plan_type}</div><InspectionMethodBadge value={row.inspectionMethod ?? row.inspection_method} /></td>
            <td className="p-3 space-y-1"><InspectionPlanStatusBadge value={row.status} /><div><SchedulerStatusBadge value={row.schedulerStatus ?? row.current_scheduler_status} /></div></td>
            <td className="p-3"><ScheduleBasisBadge value={row.scheduleBasis ?? row.current_due_basis} /></td>
            <td className="p-3"><div className="font-semibold text-[var(--psm-text)]">{row.nextDueDate ?? row.current_next_due_date ?? 'Not scheduled'}</div><InspectionDueStatusBadge value={row.dueStatus ?? row.current_due_status} /></td>
            <td className="p-3 text-[var(--psm-text)]">{row.responsible_user_id ?? row.responsible_team_id ?? 'Unassigned'}</td>
            <td className="p-3 text-[var(--psm-text)]">Rev {row.revisionNumber ?? row.revision_number ?? 0}</td>
            <td className="p-3"><div className="flex gap-2"><button onClick={() => onOpen(row)} className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 font-semibold text-[var(--psm-text)]">View</button><button onClick={() => onEdit(row)} className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 font-semibold text-[var(--psm-text)]">Edit</button></div></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  );
}
