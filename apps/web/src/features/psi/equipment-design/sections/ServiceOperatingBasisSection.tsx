import { PsiCard } from '../../shared/PsiUi';
import type { EquipmentDesignLookups } from '../../types/equipment-design.types';

const c = 'rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm';
const flags = ['corrosive_service','toxic_service','flammable_service','reactive_service','two_phase_service','slurry_solids_service','fouling_service','erosive_service','hydrogen_service','sour_service_h2s','oxygen_service','cryogenic_service','high_temperature_service'];

export function ServiceOperatingBasisSection({ value, lookups, onChange }: { value: Record<string, any>; lookups?: EquipmentDesignLookups | undefined; onChange: (patch: Record<string, any>) => void }) {
  return <PsiCard title="3. Service / Operating Basis" subtitle="Service fluid, phase, chemical hazards, operating envelope, startup/shutdown, cleaning/flushing, and abnormal service conditions.">
    <div className="grid gap-3 md:grid-cols-4">
      <input value={value.service_fluid ?? ''} onChange={(e) => onChange({ service_fluid: e.target.value, chemical_service: e.target.value })} placeholder="Service fluid / chemical service" className={c} />
      <select value={value.fluid_phase ?? ''} onChange={(e) => onChange({ fluid_phase: e.target.value })} className={c}><option value="">Fluid phase</option>{(lookups?.fluidPhases ?? []).map((item) => <option key={item}>{item}</option>)}</select>
      <input type="number" step="any" value={value.normal_operating_pressure ?? ''} onChange={(e) => onChange({ normal_operating_pressure: e.target.value })} placeholder="Normal operating pressure" className={c} />
      <input type="number" step="any" value={value.normal_operating_temperature ?? ''} onChange={(e) => onChange({ normal_operating_temperature: e.target.value })} placeholder="Normal operating temperature" className={c} />
      <input type="number" step="any" value={value.normal_flow ?? ''} onChange={(e) => onChange({ normal_flow: e.target.value })} placeholder="Normal flow" className={c} />
      {flags.map((flag) => <label key={flag} className={`${c} flex items-center gap-2`}><input type="checkbox" checked={Boolean(value[flag])} onChange={(e) => onChange({ [flag]: e.target.checked })} /> {flag.replace(/_/g, ' ')}</label>)}
      <textarea value={value.operating_envelope_summary ?? ''} onChange={(e) => onChange({ operating_envelope_summary: e.target.value })} placeholder="Operating envelope summary" className={`${c} min-h-20 md:col-span-2`} />
      <textarea value={value.startup_shutdown_service_notes ?? ''} onChange={(e) => onChange({ startup_shutdown_service_notes: e.target.value })} placeholder="Startup/shutdown service notes" className={`${c} min-h-20 md:col-span-2`} />
      <textarea value={value.cleaning_flushing_service_notes ?? ''} onChange={(e) => onChange({ cleaning_flushing_service_notes: e.target.value })} placeholder="Cleaning/flushing notes" className={`${c} min-h-20 md:col-span-2`} />
      <textarea value={value.abnormal_service_conditions ?? ''} onChange={(e) => onChange({ abnormal_service_conditions: e.target.value })} placeholder="Abnormal service conditions" className={`${c} min-h-20 md:col-span-2`} />
    </div>
  </PsiCard>;
}
