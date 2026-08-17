import { RemainingLifeStatusBadge } from '../shared/RemainingLifeStatusBadge';
import type { MiRemainingLifeEvaluation } from '../types/inspection-record.types';

export function RemainingLifeTable({ rows }: { rows: MiRemainingLifeEvaluation[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
      <table className="w-full text-left text-sm"><thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr><th className="p-3">CML</th><th className="p-3">Current</th><th className="p-3">Minimum</th><th className="p-3">Short Rate</th><th className="p-3">Long Rate</th><th className="p-3">Governing</th><th className="p-3">Remaining</th><th className="p-3">Status</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id ?? row.cml_id} className="border-t border-[var(--psm-line)]"><td className="p-3">{row.cml?.cml_number ?? row.cmlNumber ?? row.cml_id}</td><td className="p-3">{row.current_thickness ?? '-'}</td><td className="p-3">{row.minimum_required_thickness ?? '-'}</td><td className="p-3">{row.short_term_corrosion_rate ?? '-'}</td><td className="p-3">{row.long_term_corrosion_rate ?? '-'}</td><td className="p-3">{row.governing_corrosion_rate ?? '-'}</td><td className="p-3">{row.remaining_life_years ?? '-'} yrs</td><td className="p-3"><RemainingLifeStatusBadge value={row.alert_state ?? row.evaluation_status} /></td></tr>) : <tr><td colSpan={8} className="p-5 text-center text-[var(--psm-muted)]">No remaining-life evaluations available.</td></tr>}</tbody></table>
    </section>
  );
}
