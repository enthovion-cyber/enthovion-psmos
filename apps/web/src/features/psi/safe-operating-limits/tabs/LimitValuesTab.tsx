import { PsiCard } from '../../shared/PsiUi';
import type { SafeOperatingLimitDetail } from '../../types/safe-operating-limit.types';
import { LimitRangeVisualizer } from '../LimitRangeVisualizer';

const labels = ['normal_min','normal_max','normal_target','low_alert','high_alert','low_alarm','high_alarm','low_low_alarm','high_high_alarm','low_trip','high_trip','low_low_trip','high_high_trip','sif_interlock_setpoint','safe_state','trip_reset_requirement','min_design_limit','max_design_limit','min_safe_limit','max_safe_limit','mawp_mop_reference','design_temperature_reference','relief_set_pressure_reference','mechanical_limit_reference','environmental_compliance_limit_reference','basis_reference','source_document_id','engineering_calculation_reference','confidence_level','data_quality_status'];

export function LimitValuesTab({ detail }: { detail: SafeOperatingLimitDetail }) {
  const values = detail.values ?? {};
  return <div className="space-y-5"><LimitRangeVisualizer values={detail.values} unit={detail.limit.unit_of_measure} /><PsiCard title="Limit Values" subtitle="Backend source of truth for normal, alarm, trip/SIF, design, and safe boundaries."><dl className="grid gap-3 md:grid-cols-3">{labels.map((key) => <div key={key} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><dt className="text-xs uppercase text-[var(--psm-muted)]">{key.replaceAll('_', ' ')}</dt><dd className="mt-1 font-semibold">{String(values[key] ?? 'Not defined')}</dd></div>)}</dl></PsiCard></div>;
}
