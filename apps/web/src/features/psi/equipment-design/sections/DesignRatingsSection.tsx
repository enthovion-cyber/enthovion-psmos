import { PsiCard } from '../../shared/PsiUi';

const c = 'rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm';
const number = (value: Record<string, any>, key: string, onChange: (patch: Record<string, any>) => void, placeholder: string) => <input type="number" step="any" value={value[key] ?? ''} onChange={(e) => onChange({ [key]: e.target.value })} placeholder={placeholder} className={c} />;

export function DesignRatingsSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  return (
    <PsiCard title="2. Design Ratings" subtitle="Pressure, temperature, MAWP/MOP, test pressure, relief reference, design life, cyclic/fatigue basis, and SOL/relief comparison foundation.">
      <div className="grid gap-3 md:grid-cols-4">
        {number(value, 'design_pressure', onChange, 'Design pressure')}
        <input value={value.design_pressure_unit ?? ''} onChange={(e) => onChange({ design_pressure_unit: e.target.value })} placeholder="Pressure unit" className={c} />
        {number(value, 'mawp', onChange, 'MAWP')}
        <input value={value.mawp_unit ?? ''} onChange={(e) => onChange({ mawp_unit: e.target.value })} placeholder="MAWP unit" className={c} />
        {number(value, 'mop', onChange, 'MOP / max operating pressure')}
        <input value={value.mop_unit ?? ''} onChange={(e) => onChange({ mop_unit: e.target.value })} placeholder="MOP unit" className={c} />
        {number(value, 'vacuum_design_pressure', onChange, 'Vacuum design pressure')}
        {number(value, 'hydrotest_pressure', onChange, 'Hydrotest pressure')}
        {number(value, 'pneumatic_test_pressure', onChange, 'Pneumatic test pressure')}
        <input value={value.relief_set_pressure_reference ?? ''} onChange={(e) => onChange({ relief_set_pressure_reference: e.target.value })} placeholder="Relief set pressure reference" className={c} />
        <input value={value.pressure_rating_basis ?? ''} onChange={(e) => onChange({ pressure_rating_basis: e.target.value })} placeholder="Pressure rating basis" className={c} />
        {number(value, 'min_design_temperature', onChange, 'Min design temperature')}
        {number(value, 'max_design_temperature', onChange, 'Max design temperature')}
        {number(value, 'min_normal_operating_temperature', onChange, 'Min normal operating temp')}
        {number(value, 'max_normal_operating_temperature', onChange, 'Max normal operating temp')}
        {number(value, 'maximum_allowable_temperature', onChange, 'Maximum allowable temp')}
        {number(value, 'minimum_design_metal_temperature', onChange, 'MDMT')}
        <input value={value.temperature_unit ?? ''} onChange={(e) => onChange({ temperature_unit: e.target.value })} placeholder="Temperature unit" className={c} />
        <input value={value.temperature_rating_basis ?? ''} onChange={(e) => onChange({ temperature_rating_basis: e.target.value })} placeholder="Temperature rating basis" className={c} />
        {number(value, 'design_life_years', onChange, 'Design life years')}
        <input type="date" value={value.commissioning_date ?? ''} onChange={(e) => onChange({ commissioning_date: e.target.value })} className={c} />
        <input value={value.remaining_design_life_foundation ?? ''} onChange={(e) => onChange({ remaining_design_life_foundation: e.target.value })} placeholder="Remaining design life foundation" className={c} />
        <input value={value.design_margin_safety_factor ?? ''} onChange={(e) => onChange({ design_margin_safety_factor: e.target.value })} placeholder="Design margin / safety factor" className={c} />
        <textarea value={value.external_design_conditions ?? ''} onChange={(e) => onChange({ external_design_conditions: e.target.value })} placeholder="External design conditions" className={`${c} min-h-20 md:col-span-2`} />
        <textarea value={value.internal_design_conditions ?? ''} onChange={(e) => onChange({ internal_design_conditions: e.target.value })} placeholder="Internal design conditions" className={`${c} min-h-20 md:col-span-2`} />
        <label className={`${c} flex items-center gap-2`}><input type="checkbox" checked={Boolean(value.cyclic_service)} onChange={(e) => onChange({ cyclic_service: e.target.checked })} /> Cyclic service</label>
        <label className={`${c} flex items-center gap-2`}><input type="checkbox" checked={Boolean(value.fatigue_consideration)} onChange={(e) => onChange({ fatigue_consideration: e.target.checked })} /> Fatigue consideration</label>
      </div>
    </PsiCard>
  );
}
