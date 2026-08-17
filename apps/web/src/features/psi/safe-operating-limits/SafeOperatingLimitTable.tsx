import Link from 'next/link';
import { LimitCompletenessBadge } from '../shared/LimitCompletenessBadge';
import { LimitConflictBadge } from '../shared/LimitConflictBadge';
import { LimitCriticalityBadge } from '../shared/LimitCriticalityBadge';
import { MocRequiredBadge } from '../shared/MocRequiredBadge';
import { PssrBlockerBadge } from '../shared/PssrBlockerBadge';
import type { SafeOperatingLimit } from '../types/safe-operating-limit.types';

function range(row: SafeOperatingLimit, min?: unknown, max?: unknown, target?: unknown) {
  if (target !== null && target !== undefined) return `Target ${target} ${row.unit_of_measure}`;
  if (min !== null && min !== undefined && max !== null && max !== undefined) return `${min} - ${max} ${row.unit_of_measure}`;
  if (min !== null && min !== undefined) return `>= ${min} ${row.unit_of_measure}`;
  if (max !== null && max !== undefined) return `<= ${max} ${row.unit_of_measure}`;
  return 'Missing';
}

export function SafeOperatingLimitTable({ rows }: { rows: SafeOperatingLimit[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] xl:block">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-left text-xs uppercase text-[var(--psm-muted)]">
          <tr>{['Parameter / Tag', 'Unit', 'Equipment', 'Parameter Type', 'Normal Range', 'Alarm Limit', 'Trip / SIF Limit', 'Design Limit', 'Safe Limit', 'Criticality', 'Consequence', 'Operator Response', 'Safeguard', 'Conflict', 'Review', 'MOC', 'PSSR', 'Actions'].map((header) => <th key={header} className="px-3 py-3">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--psm-line)]">
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="px-3 py-3"><Link className="font-semibold text-primary hover:underline" href={`/process-safety-information/safe-operating-limits/${row.id}`}>{row.parameter_name}</Link><p className="mt-1 text-xs text-[var(--psm-muted)]">{row.parameter_tag ?? row.limit_title}</p></td>
              <td className="px-3 py-3">{row.unit_id}</td>
              <td className="px-3 py-3">{row.equipment_id ?? 'Unit-level'}</td>
              <td className="px-3 py-3">{row.parameter_type}</td>
              <td className="px-3 py-3">{range(row, row.values?.normal_min, row.values?.normal_max, row.values?.normal_target)}</td>
              <td className="px-3 py-3">{range(row, row.values?.low_alarm, row.values?.high_alarm)}</td>
              <td className="px-3 py-3">{row.values?.sif_interlock_setpoint ?? row.values?.high_trip ?? row.values?.low_trip ?? 'Missing'}</td>
              <td className="px-3 py-3">{range(row, row.values?.min_design_limit, row.values?.max_design_limit)}</td>
              <td className="px-3 py-3">{range(row, row.values?.min_safe_limit, row.values?.max_safe_limit)}</td>
              <td className="px-3 py-3"><LimitCriticalityBadge value={row.criticality} /></td>
              <td className="px-3 py-3">{row.missingConsequence ? <span className="text-warning">Missing</span> : 'Documented'}</td>
              <td className="px-3 py-3">{row.missingOperatorResponse ? <span className="text-warning">Missing</span> : 'Documented'}</td>
              <td className="px-3 py-3">{row.missingSafeguard ? <span className="text-danger">Missing</span> : 'Linked'}</td>
              <td className="px-3 py-3"><LimitConflictBadge status={row.conflict_status} /></td>
              <td className="px-3 py-3"><LimitCompletenessBadge status={row.completeness_status} score={row.completeness_score} /></td>
              <td className="px-3 py-3"><MocRequiredBadge value={row.moc_update_required} /></td>
              <td className="px-3 py-3"><PssrBlockerBadge value={row.pssr_blocker} /></td>
              <td className="px-3 py-3"><div className="flex flex-col gap-1"><Link className="text-primary hover:underline" href={`/process-safety-information/safe-operating-limits/${row.id}`}>View</Link><Link className="text-primary hover:underline" href={`/process-safety-information/safe-operating-limits/${row.id}/edit`}>Edit</Link></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
