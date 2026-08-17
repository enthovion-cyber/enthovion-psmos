import { PsiCard } from '../../shared/PsiUi';

const fields = [
  ['normal_min', 'Normal minimum'], ['normal_max', 'Normal maximum'], ['normal_target', 'Normal target'], ['normal_range_basis', 'Normal range basis'],
  ['low_alert', 'Low alert'], ['high_alert', 'High alert'], ['low_alarm', 'Low alarm'], ['high_alarm', 'High alarm'], ['low_low_alarm', 'Low-low alarm'], ['high_high_alarm', 'High-high alarm'],
  ['low_trip', 'Low trip'], ['high_trip', 'High trip'], ['low_low_trip', 'Low-low trip'], ['high_high_trip', 'High-high trip'], ['sif_interlock_setpoint', 'SIF / interlock setpoint'],
  ['safe_state', 'Safe state'], ['trip_reset_requirement', 'Trip reset requirement'], ['min_design_limit', 'Minimum design limit'], ['max_design_limit', 'Maximum design limit'], ['min_safe_limit', 'Minimum safe limit'], ['max_safe_limit', 'Maximum safe limit'],
  ['mawp_mop_reference', 'MAWP / MOP reference'], ['design_temperature_reference', 'Design temperature reference'], ['relief_set_pressure_reference', 'Relief set pressure reference'], ['mechanical_limit_reference', 'Mechanical limit reference'], ['environmental_compliance_limit_reference', 'Environmental / compliance limit reference'],
  ['basis_reference', 'Basis / reference'], ['source_document_id', 'Source document ID'], ['engineering_calculation_reference', 'Engineering calculation reference'], ['confidence_level', 'Confidence level'], ['data_quality_status', 'Data quality status']
] as const;

export function LimitValuesSection({ value, onChange }: { value: Record<string, any>; onChange: (patch: Record<string, any>) => void }) {
  return (
    <PsiCard title="3. Limit Values" subtitle="Normal operating range, alarm limits, trip/interlock/SIF limits, design limits, safe limits, and engineering basis fields.">
      <div className="grid gap-3 md:grid-cols-3">{fields.map(([key, label]) => <input key={key} value={value[key] ?? ''} onChange={(e) => onChange({ [key]: e.target.value })} placeholder={label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />)}</div>
      <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Backend validates inconsistent ranges: alarms outside safe limits, trips outside design boundaries, normal ranges outside alarm ranges, missing unit conversion, and duplicate conflicting active records.</p>
    </PsiCard>
  );
}
