export function ReliefReviewSaveSection({ saving, disabledReason }: { saving?: boolean; disabledReason?: string | null }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <h2 className="font-semibold">Review & Save</h2>
      <p className="mt-1 text-sm text-[var(--psm-muted)]">Backend validates company/site isolation, protected equipment scope, due status, readiness, history, and MOC suggestion rules.</p>
      {disabledReason ? <p className="mt-3 rounded-lg bg-warning/10 p-3 text-sm text-warning">{disabledReason}</p> : null}
      <button type="submit" disabled={saving || !!disabledReason} className="mt-4 rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Saving...' : 'Save relief device'}</button>
    </section>
  );
}
