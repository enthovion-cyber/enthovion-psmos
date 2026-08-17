'use client';

export function TechnicalDataHeader({ completeness, saving, onSave }: { completeness?: Record<string, unknown> | undefined; saving?: boolean; onSave: () => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--psm-muted)]">Mechanical Integrity</p>
        <h2 className="text-2xl font-bold text-[var(--psm-text)]">Equipment Technical Data</h2>
        <p className="mt-1 text-sm text-[var(--psm-muted)]">Design, operating, materials, code/rating, protection, drawings, and safety-critical attributes.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">
          <span className="text-[var(--psm-muted)]">Completeness </span>
          <strong className="text-[var(--psm-text)]">{String(completeness?.score ?? 0)}%</strong>
        </div>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} onClick={onSave}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
