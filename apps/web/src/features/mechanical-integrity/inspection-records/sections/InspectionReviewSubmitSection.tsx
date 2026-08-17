'use client';

export function InspectionReviewSubmitSection({ blockers, warnings, readOnlyReason, onSubmit, onApprove, onReject, saving }: { blockers?: string[] | undefined; warnings?: string[] | undefined; readOnlyReason?: string | null | undefined; onSubmit?: (() => void) | undefined; onApprove?: (() => void) | undefined; onReject?: (() => void) | undefined; saving?: boolean | undefined }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h2 className="font-bold text-[var(--psm-text)]">Review / Submit</h2>
      {readOnlyReason ? <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">{readOnlyReason}</div> : null}
      {blockers?.length ? <div className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger"><p className="font-semibold">Submit blocked</p><ul className="mt-2 list-disc pl-5">{blockers.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
      {warnings?.length ? <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning"><ul className="list-disc pl-5">{warnings.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {onSubmit ? <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving || !!blockers?.length} title={blockers?.length ? blockers.join(' ') : undefined} onClick={onSubmit}>{saving ? 'Working...' : 'Submit for Review'}</button> : null}
        {onApprove ? <button className="rounded-lg border border-success/40 px-3 py-2 text-sm font-semibold text-success disabled:opacity-60" disabled={saving} onClick={onApprove}>Approve</button> : null}
        {onReject ? <button className="rounded-lg border border-danger/40 px-3 py-2 text-sm font-semibold text-danger disabled:opacity-60" disabled={saving} onClick={onReject}>Reject</button> : null}
      </div>
    </section>
  );
}
