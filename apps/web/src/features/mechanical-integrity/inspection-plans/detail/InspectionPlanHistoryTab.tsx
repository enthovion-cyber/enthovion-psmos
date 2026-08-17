import type { MiInspectionPlanDetail } from '../../types/inspection-plan.types';

export function InspectionPlanHistoryTab({ detail }: { detail: MiInspectionPlanDetail }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h2 className="font-bold text-[var(--psm-text)]">History</h2><p className="mt-2 text-sm text-[var(--psm-muted)]">MI history events are written by backend actions for plan create/update/approval/scheduler/import/export. Equipment history preview is available from the equipment History tab.</p><pre className="mt-3 overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs text-[var(--psm-muted)]">{JSON.stringify({ planId: detail.plan.id, lastEvaluation: detail.latestEvaluation }, null, 2)}</pre></div>;
}
