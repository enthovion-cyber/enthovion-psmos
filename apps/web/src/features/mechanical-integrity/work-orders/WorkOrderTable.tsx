'use client';

import Link from 'next/link';
import type { MiWorkOrderRow } from '../types/work-order.types';
import { ActionButton, cardValue } from '../safeguards/SafeguardUiPrimitives';
import { WorkOrderStatusBadge } from '../shared/WorkOrderStatusBadge';
import { WorkPriorityBadge } from '../shared/WorkPriorityBadge';
import { PtwStatusBadge } from '../shared/PtwStatusBadge';
import { LotoStatusBadge } from '../shared/LotoStatusBadge';
import { PartsStatusBadge } from '../shared/PartsStatusBadge';
import { VerificationStatusBadge } from '../shared/VerificationStatusBadge';
import { ReadinessImpactBadge } from '../shared/ReadinessImpactBadge';

export function WorkOrderTable({ rows = [] }: { rows?: MiWorkOrderRow[] | undefined }) {
  if (!rows.length) return <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-6 text-sm text-[var(--psm-muted)]">No work orders match the current filters.</div>;
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] lg:block">
      <table className="min-w-[1700px] w-full text-left text-sm">
        <thead className="bg-[var(--psm-surface-2)] text-xs uppercase text-[var(--psm-muted)]"><tr>{['Work Order Number','Title','Equipment','Source','Type','Priority','Risk Level','Status','Assigned To','Owner','Planned Start','Due Date','PTW','LOTO','Parts','Shutdown','Verification','Readiness Impact','Linked Deficiency','Linked Action','Last Updated','Actions'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
        <tbody>{rows.map((row) => (
          <tr key={row.id} className="border-t border-[var(--psm-line)] align-top">
            <td className="px-4 py-3 font-semibold">{cardValue(row.work_order_number)}</td>
            <td className="px-4 py-3">{cardValue(row.title)}</td>
            <td className="px-4 py-3">{cardValue(row.equipment_tag ?? row.equipment_id)}</td>
            <td className="px-4 py-3">{cardValue(row.source_module ?? 'Manual')}</td>
            <td className="px-4 py-3">{cardValue(row.work_order_type)}</td>
            <td className="px-4 py-3"><WorkPriorityBadge priority={row.priority} /></td>
            <td className="px-4 py-3">{cardValue(row.risk_level)}</td>
            <td className="px-4 py-3"><WorkOrderStatusBadge status={row.status} /></td>
            <td className="px-4 py-3">{cardValue(row.assigned_user_id)}</td>
            <td className="px-4 py-3">{cardValue(row.owner_user_id)}</td>
            <td className="px-4 py-3">{cardValue(row.planned_start_at)}</td>
            <td className="px-4 py-3">{cardValue(row.due_date)}</td>
            <td className="px-4 py-3"><PtwStatusBadge required={row.ptw_required} linked={row.linked_ptw_id} /></td>
            <td className="px-4 py-3"><LotoStatusBadge required={row.loto_required} linked={row.linked_loto_id} /></td>
            <td className="px-4 py-3"><PartsStatusBadge status={row.parts_status} /></td>
            <td className="px-4 py-3">{cardValue(row.required_shutdown, 'No')}</td>
            <td className="px-4 py-3"><VerificationStatusBadge required={row.verification_required} status={row.status === 'Verified' ? 'Verified' : undefined} /></td>
            <td className="px-4 py-3"><ReadinessImpactBadge impact={row.readiness_impact} blocked={row.startup_blocker} /></td>
            <td className="px-4 py-3">{cardValue(row.linked_deficiency_id)}</td>
            <td className="px-4 py-3">{cardValue(row.linked_action_id)}</td>
            <td className="px-4 py-3">{row.updated_at ? new Date(row.updated_at).toLocaleString() : 'Not recorded'}</td>
            <td className="px-4 py-3"><Link href={`/mechanical-integrity/work-orders/${row.id}`}><ActionButton>View</ActionButton></Link></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
