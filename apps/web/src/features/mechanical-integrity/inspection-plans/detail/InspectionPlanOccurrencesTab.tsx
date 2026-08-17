import type { MiInspectionPlanDetail } from '../../types/inspection-plan.types';
import { InspectionDueStatusBadge } from '../../shared/InspectionDueStatusBadge';

export function InspectionPlanOccurrencesTab({ detail }: { detail: MiInspectionPlanDetail }) {
  const rows = detail.occurrences ?? [];
  return <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h2 className="font-bold text-[var(--psm-text)]">Inspection Occurrences</h2><div className="mt-3 space-y-2">{rows.length ? rows.map((row) => <div key={String(row.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--psm-line)] p-3 text-sm"><span className="font-semibold text-[var(--psm-text)]">{String(row.occurrence_number)}</span><span className="text-[var(--psm-muted)]">{String(row.due_date)} - {String(row.due_basis ?? '')}</span><InspectionDueStatusBadge value={String(row.status ?? '')} /></div>) : <div className="text-sm text-[var(--psm-muted)]">No future placeholders generated yet. Approved active plans generate occurrences through the scheduler.</div>}</div></div>;
}
