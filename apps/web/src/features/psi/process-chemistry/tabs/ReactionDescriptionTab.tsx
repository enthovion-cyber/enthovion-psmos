import { PsiCard } from '../../shared/PsiUi';
import type { ProcessChemistryDetail } from '../../types/process-chemistry.types';

export function ReactionDescriptionTab({ detail }: { detail: ProcessChemistryDetail }) {
  const row = detail.chemistry;
  const items = ['main_reaction_equation','balanced_reaction_available','unavailable_reaction_reason','reaction_mechanism_summary','process_purpose','desired_conversion','desired_selectivity','main_side_reactions','byproducts_summary','waste_streams_summary','reaction_phase','reversible_reaction','catalyst_involved','inhibitor_required','solvent_involved','water_moisture_sensitivity','air_oxygen_sensitivity','addition_order_sensitivity','mixing_sensitivity','cooling_sensitivity'];
  return <PsiCard title="Reaction Description" subtitle="PDF-required reaction basis and sensitivity fields."><div className="grid gap-3 md:grid-cols-2">{items.map((item) => <div key={item} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{item.replaceAll('_', ' ')}</p><p className="mt-1 text-sm">{String(row[item] ?? 'Not recorded')}</p></div>)}</div></PsiCard>;
}
