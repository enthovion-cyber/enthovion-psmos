'use client';

export function RemainingLifeCalculationPanel({ onRecalculate, saving }: { onRecalculate?: () => void; saving?: boolean }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h2 className="font-bold text-[var(--psm-text)]">Calculation Governance</h2>
      <p className="mt-1 text-sm text-[var(--psm-muted)]">Remaining life is calculated on the backend using approved CML/TML readings, configured units, minimum thickness limits, and governing corrosion-rate rules. Preview values from draft readings are not official until approved.</p>
      {onRecalculate ? <button className="mt-4 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} onClick={onRecalculate}>{saving ? 'Recalculating...' : 'Recalculate Remaining Life'}</button> : null}
    </section>
  );
}
