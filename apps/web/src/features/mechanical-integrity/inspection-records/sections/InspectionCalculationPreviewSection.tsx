'use client';

import { RemainingLifeStatusBadge } from '../../shared/RemainingLifeStatusBadge';
import type { MiRemainingLifeSummary } from '../../types/inspection-record.types';

export function InspectionCalculationPreviewSection({ data, onRecalculate, saving }: { data?: MiRemainingLifeSummary | undefined; onRecalculate?: (() => void) | undefined; saving?: boolean | undefined }) {
  const rows = data?.rows ?? [];
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-[var(--psm-text)]">Remaining Life Calculation Preview</h2>{onRecalculate ? <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" disabled={saving} onClick={onRecalculate}>{saving ? 'Calculating...' : 'Recalculate'}</button> : null}</div>
      <div className="mt-4 overflow-hidden rounded-lg border border-[var(--psm-line)]"><table className="w-full text-left text-sm"><thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="p-3">CML</th><th className="p-3">Current</th><th className="p-3">Governing Rate</th><th className="p-3">Remaining Life</th><th className="p-3">Half-life Due</th><th className="p-3">Status</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id ?? row.cml_id} className="border-t border-[var(--psm-line)]"><td className="p-3">{row.cml?.cml_number ?? row.cmlNumber ?? row.cml_id}</td><td className="p-3">{row.current_thickness ?? '-'}</td><td className="p-3">{row.governing_corrosion_rate ?? '-'}</td><td className="p-3">{row.remaining_life_years ?? '-'} yrs</td><td className="p-3">{row.half_life_due_date ?? '-'}</td><td className="p-3"><RemainingLifeStatusBadge value={row.alert_state ?? row.evaluation_status} /></td></tr>) : <tr><td colSpan={6} className="p-5 text-center text-[var(--psm-muted)]">No calculation preview available.</td></tr>}</tbody></table></div>
    </section>
  );
}
