import type { MiInspectionPlanDetail } from '../../types/inspection-plan.types';
import { InspectionPlanStatusBadge } from '../../shared/InspectionPlanStatusBadge';

export function InspectionPlanRevisionsTab({ detail }: { detail: MiInspectionPlanDetail }) {
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h2 className="font-bold text-[var(--psm-text)]">Revision / Approval History</h2><div className="mt-3 space-y-2">{detail.revisions?.length ? detail.revisions.map((row) => <div key={String(row.id)} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="flex justify-between gap-3"><span className="font-semibold text-[var(--psm-text)]">Revision {String(row.revision_number)}</span><InspectionPlanStatusBadge value={String(row.status ?? '')} /></div><div className="mt-1 text-sm text-[var(--psm-muted)]">{String(row.change_reason ?? 'No reason')} - {String(row.created_at ?? '')}</div></div>) : <div className="text-sm text-[var(--psm-muted)]">No revision events yet.</div>}</div></div>;
}
