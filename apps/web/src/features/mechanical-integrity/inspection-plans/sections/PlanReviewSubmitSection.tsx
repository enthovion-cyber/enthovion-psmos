import type { InspectionPlanFormState } from '../../types/inspection-plan.types';

export function PlanReviewSubmitSection({ value, disabledReason }: { value: InspectionPlanFormState; disabledReason?: string | null }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <h2 className="font-bold text-[var(--psm-text)]">Review & Submit</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <div><div className="text-xs text-[var(--psm-muted)]">Title</div><div className="font-semibold text-[var(--psm-text)]">{value.planTitle || 'Missing'}</div></div>
        <div><div className="text-xs text-[var(--psm-muted)]">Type</div><div className="font-semibold text-[var(--psm-text)]">{value.planType || 'Missing'}</div></div>
        <div><div className="text-xs text-[var(--psm-muted)]">Method</div><div className="font-semibold text-[var(--psm-text)]">{value.inspectionMethod || 'Missing'}</div></div>
      </div>
      {disabledReason ? <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{disabledReason}</div> : <p className="mt-3 text-sm text-[var(--psm-muted)]">Ready to save as draft. Approval and occurrence generation are backend-controlled after review.</p>}
    </section>
  );
}
