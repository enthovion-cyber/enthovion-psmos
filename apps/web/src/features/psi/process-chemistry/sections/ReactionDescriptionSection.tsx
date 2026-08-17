import { PsiCard } from '../../shared/PsiUi';
import type { ProcessChemistryLookups } from '../../types/process-chemistry.types';

export function ReactionDescriptionSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: ProcessChemistryLookups | undefined; onChange: (patch: Record<string, any>) => void }) {
  return (
    <PsiCard title="Reaction Description" subtitle="Reaction equation, purpose, mechanism, conversion, selectivity, side reactions, byproducts, waste streams, and sensitivity flags.">
      <div className="grid gap-3 md:grid-cols-2">
        <textarea required value={value.process_chemistry_summary ?? ''} onChange={(e) => onChange({ process_chemistry_summary: e.target.value })} placeholder="Process chemistry summary" className="min-h-28 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm md:col-span-2" />
        <textarea value={value.main_reaction_equation ?? ''} onChange={(e) => onChange({ main_reaction_equation: e.target.value })} placeholder="Main reaction equation" className="min-h-24 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <textarea value={value.unavailable_reaction_reason ?? ''} onChange={(e) => onChange({ unavailable_reaction_reason: e.target.value })} placeholder="Unavailable reaction reason / unknown chemistry basis" className="min-h-24 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <select value={value.reaction_phase ?? ''} onChange={(e) => onChange({ reaction_phase: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">
          <option value="">Reaction phase</option>
          {(lookups?.reactionPhases ?? []).map((item) => <option key={item}>{item}</option>)}
        </select>
        <input value={value.process_purpose ?? ''} onChange={(e) => onChange({ process_purpose: e.target.value })} placeholder="Process purpose" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        {['reversible_reaction', 'catalyst_involved', 'inhibitor_required', 'solvent_involved', 'water_moisture_sensitivity', 'air_oxygen_sensitivity', 'addition_order_sensitivity', 'mixing_sensitivity', 'cooling_sensitivity'].map((key) => (
          <label key={key} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(value[key])} onChange={(e) => onChange({ [key]: e.target.checked })} />{key.replaceAll('_', ' ')}</label>
        ))}
      </div>
    </PsiCard>
  );
}
