import { PsiCard } from '../../shared/PsiUi';

export function ReactionHazardsSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  const levels = ['Low', 'Medium', 'High', 'Critical', 'Unknown / Needs Study'];
  const selectFields = ['hazard_level','runaway_potential','decomposition_potential','polymerization_potential','overpressure_potential','toxic_gas_generation_potential','incompatible_mixing_risk','thermal_instability_risk'];
  return (
    <PsiCard title="Reaction Hazards" subtitle="Exothermic/endothermic behavior, heat release, runaway/decomposition/polymerization, overpressure, toxic gas, corrosion, fouling, dust, static, and environmental release concerns.">
      <div className="grid gap-3 md:grid-cols-4">
        {selectFields.map((field) => <select key={field} value={value[field] ?? ''} onChange={(e) => onChange({ [field]: e.target.value })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><option value="">{field.replaceAll('_', ' ')}</option>{levels.map((item) => <option key={item}>{item}</option>)}</select>)}
        {['exothermic', 'endothermic', 'heat_of_reaction_available', 'adiabatic_temperature_rise_available', 'static_ignition_concern', 'dust_explosion_concern', 'environmental_release_concern'].map((field) => <label key={field} className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(value[field])} onChange={(e) => onChange({ [field]: e.target.checked })} />{field.replaceAll('_', ' ')}</label>)}
        <textarea value={value.reaction_hazard_summary ?? ''} onChange={(e) => onChange({ reaction_hazard_summary: e.target.value })} placeholder="Reaction hazard summary and test basis" className="min-h-28 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm md:col-span-4" />
      </div>
    </PsiCard>
  );
}
