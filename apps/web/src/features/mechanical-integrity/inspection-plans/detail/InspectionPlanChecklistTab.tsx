import type { MiInspectionPlanDetail } from '../../types/inspection-plan.types';

export function InspectionPlanChecklistTab({ detail }: { detail: MiInspectionPlanDetail }) {
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h2 className="font-bold text-[var(--psm-text)]">Checklist Items</h2><div className="mt-3 space-y-2">{detail.checklist?.length ? detail.checklist.map((item) => <div key={String(item.id)} className="rounded-lg border border-[var(--psm-line)] p-3"><div className="font-semibold text-[var(--psm-text)]">{String(item.item_title ?? item.itemTitle)}</div><div className="text-sm text-[var(--psm-muted)]">{String(item.requirement_text ?? '')} - {String(item.response_type ?? '')}</div></div>) : <div className="text-sm text-[var(--psm-muted)]">No checklist foundation items yet.</div>}</div></div>
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4"><h2 className="font-bold text-[var(--psm-text)]">Acceptance Criteria</h2><div className="mt-3 space-y-2">{detail.acceptanceCriteria?.length ? detail.acceptanceCriteria.map((item) => <div key={String(item.id)} className="rounded-lg border border-[var(--psm-line)] p-3 text-sm text-[var(--psm-text)]">{String(item.criterion_type)} {String(item.operator ?? '')} {String(item.value_numeric ?? item.value_text ?? '')} {String(item.unit ?? '')}</div>) : <div className="text-sm text-[var(--psm-muted)]">No acceptance criteria yet.</div>}</div></div>
    </div>
  );
}
