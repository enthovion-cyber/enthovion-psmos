'use client';

import Link from 'next/link';
import type { MiDeficiencyRow } from '../types/deficiency.types';
import { ActionButton, cardValue } from '../safeguards/SafeguardUiPrimitives';
import { DeficiencySeverityBadge } from '../shared/DeficiencySeverityBadge';
import { DeficiencyStatusBadge } from '../shared/DeficiencyStatusBadge';
import { ReadinessImpactBadge } from '../shared/ReadinessImpactBadge';

export function DeficiencyRegisterTable({ rows = [] }: { rows?: MiDeficiencyRow[] | undefined }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No deficiencies match the current filters.</div>;
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-[1500px] w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]">
          <tr>{['Record Number','Record Type','Title','Equipment','Source','Severity','Risk Level','Status','Readiness Impact','Startup Blocker','Temporary Control','Due Date','Owner','MOC/PSSR/LOPA','Last Updated','Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
              <td className="px-4 py-3 font-semibold">{cardValue(row.record_number)}</td>
              <td className="px-4 py-3">{cardValue(row.record_kind)}</td>
              <td className="px-4 py-3">{cardValue(row.title)}</td>
              <td className="px-4 py-3">{cardValue(row.equipment_tag ?? row.equipment_id)}</td>
              <td className="px-4 py-3">{cardValue(row.source_module)}</td>
              <td className="px-4 py-3"><DeficiencySeverityBadge severity={row.severity} /></td>
              <td className="px-4 py-3"><DeficiencySeverityBadge severity={row.risk_level} /></td>
              <td className="px-4 py-3"><DeficiencyStatusBadge status={row.status} /></td>
              <td className="px-4 py-3"><ReadinessImpactBadge impact={row.fitness_for_service_impact} blocked={row.startup_blocker} /></td>
              <td className="px-4 py-3">{cardValue(row.startup_blocker, 'No')}</td>
              <td className="px-4 py-3">{cardValue(row.temporary_control_required, 'No')}</td>
              <td className="px-4 py-3">{cardValue(row.due_date)}</td>
              <td className="px-4 py-3">{cardValue(row.owner_user_id)}</td>
              <td className="px-4 py-3">{[row.moc_required ? 'MOC' : null, row.pssr_impact ? 'PSSR' : null, row.lopa_sil_impact ? 'LOPA/SIL' : null].filter(Boolean).join(', ') || 'None'}</td>
              <td className="px-4 py-3">{row.updated_at ? new Date(row.updated_at).toLocaleString() : 'Not recorded'}</td>
              <td className="px-4 py-3"><Link href={`/mechanical-integrity/deficiencies/${row.id}`}><ActionButton>View details</ActionButton></Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
