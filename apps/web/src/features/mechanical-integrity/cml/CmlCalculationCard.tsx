'use client';

import type { MiCmlCalculation } from '../types/cml.types';
import { CmlStatusBadge } from '../shared/CmlStatusBadge';

const rows = [
  ['latest_thickness', 'Latest Thickness'], ['latest_reading_date', 'Latest Reading Date'], ['short_term_corrosion_rate', 'Short-Term Corrosion Rate'], ['long_term_corrosion_rate', 'Long-Term Corrosion Rate'], ['governing_corrosion_rate', 'Governing Corrosion Rate'], ['remaining_life_years', 'Remaining Life'], ['next_due_date', 'Next Due Date'], ['next_due_basis', 'Next Due Basis']
] as const;

export function CmlCalculationCard({ calculation, onRecalculate, recalculating }: { calculation?: MiCmlCalculation | null | undefined; onRecalculate: () => void; recalculating?: boolean }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div><h3 className="font-bold text-[var(--psm-text)]">Corrosion / Remaining Life Calculation</h3><p className="text-sm text-[var(--psm-muted)]">Backend-generated calculation snapshot.</p></div>
        <CmlStatusBadge value={calculation?.alert_status ?? calculation?.calculation_status} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map(([key, label]) => <div key={key} className="rounded-lg bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">{label}</p><p className="mt-1 font-bold text-[var(--psm-text)]">{String(calculation?.[key] ?? 'Not calculated')}</p></div>)}
      </div>
      <button className="mt-4 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]" onClick={onRecalculate} disabled={recalculating}>{recalculating ? 'Recalculating...' : 'Recalculate'}</button>
    </section>
  );
}
