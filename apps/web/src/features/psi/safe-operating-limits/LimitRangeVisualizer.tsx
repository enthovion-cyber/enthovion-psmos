import { PsiCard } from '../shared/PsiUi';
import type { SafeOperatingLimitValues } from '../types/safe-operating-limit.types';

export function LimitRangeVisualizer({ values, unit }: { values?: SafeOperatingLimitValues | null | undefined; unit?: string | null | undefined }) {
  const items = [
    ['Normal', values?.normal_min, values?.normal_max, 'bg-info'],
    ['Alarm', values?.low_alarm, values?.high_alarm, 'bg-warning'],
    ['Trip / SIF', values?.low_trip, values?.high_trip ?? values?.sif_interlock_setpoint, 'bg-danger'],
    ['Safe', values?.min_safe_limit, values?.max_safe_limit, 'bg-success'],
    ['Design', values?.min_design_limit, values?.max_design_limit, 'bg-primary']
  ];
  return (
    <PsiCard title="Limit Range Visualization" subtitle="Normal, alarm, trip/SIF, safe, and design boundaries shown from backend SOL values.">
      <div className="space-y-3">{items.map(([label, min, max, color]) => <div key={String(label)}><div className="mb-1 flex justify-between text-xs text-[var(--psm-muted)]"><span>{label}</span><span>{min ?? '-'} to {max ?? '-'} {unit ?? ''}</span></div><div className="h-3 rounded-full bg-[var(--psm-surface-3)]"><div className={`h-3 rounded-full ${color}`} style={{ width: min || max ? '72%' : '8%' }} /></div></div>)}</div>
    </PsiCard>
  );
}
