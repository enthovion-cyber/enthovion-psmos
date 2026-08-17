import type { MiInspectionPlanDetail } from '../../types/inspection-plan.types';
import { InspectionDueStatusBadge } from '../../shared/InspectionDueStatusBadge';

export function InspectionPlanOverviewTab({ detail }: { detail: MiInspectionPlanDetail }) {
  const plan = detail.plan;
  const cards = [
    ['Equipment', plan.equipmentTag ?? plan.equipment_id],
    ['Plan type', plan.planType ?? plan.plan_type],
    ['Inspection method', plan.inspectionMethod ?? plan.inspection_method],
    ['Next due', plan.nextDueDate ?? plan.current_next_due_date ?? 'Not scheduled'],
    ['Responsible', plan.responsible_user_id ?? plan.responsible_team_id ?? 'Unassigned'],
    ['Revision', `Rev ${plan.revisionNumber ?? plan.revision_number ?? 0}`]
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {cards.map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><div className="text-xs text-[var(--psm-muted)]">{label}</div><div className="mt-1 font-bold text-[var(--psm-text)]">{value}</div></div>)}
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 lg:col-span-3"><h2 className="font-bold text-[var(--psm-text)]">Readiness / Missing Data</h2><div className="mt-3 space-y-2">{detail.validation?.blockers?.map((item) => <div key={item} className="rounded-lg bg-danger/10 p-2 text-sm text-danger">{item}</div>)}{detail.validation?.warnings?.map((item) => <div key={item} className="rounded-lg bg-warning/10 p-2 text-sm text-warning">{item}</div>)}{!detail.validation?.blockers?.length && !detail.validation?.warnings?.length ? <div className="text-sm text-[var(--psm-muted)]">No readiness blockers found.</div> : null}</div></div>
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 lg:col-span-3"><h2 className="font-bold text-[var(--psm-text)]">Due / Overdue Preview</h2><div className="mt-2 flex items-center gap-3 text-sm text-[var(--psm-text)]"><InspectionDueStatusBadge value={String(detail.latestEvaluation?.due_status ?? plan.dueStatus ?? '')} /> <span>{String(detail.latestEvaluation?.final_due_basis ?? plan.scheduleBasis ?? 'No basis')}</span></div></div>
    </div>
  );
}
