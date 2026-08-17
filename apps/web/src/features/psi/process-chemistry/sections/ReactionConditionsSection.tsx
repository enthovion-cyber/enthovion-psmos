import { PsiCard } from '../../shared/PsiUi';

export function ReactionConditionsSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  const fields = ['normal_temperature','min_temperature','max_temperature','temperature_unit','normal_pressure','min_pressure','max_pressure','pressure_unit','ph_normal','ph_min','ph_max','normal_concentration_range','feed_ratio_range','residence_time','agitation_speed','cooling_duty','heating_duty','inerting_requirement','oxygen_limit','moisture_limit','addition_rate_limit','venting_requirement','heat_release_absorption','gas_generation'];
  return (
    <PsiCard title="Normal Reaction Conditions" subtitle="Temperature, pressure, pH, concentration, feed ratio, residence time, utilities, inerting, limits, and gas/heat behavior.">
      <div className="grid gap-3 md:grid-cols-4">{fields.map((field) => <input key={field} value={value[field] ?? ''} onChange={(e) => onChange({ [field]: e.target.value })} placeholder={field.replaceAll('_', ' ')} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />)}</div>
    </PsiCard>
  );
}
