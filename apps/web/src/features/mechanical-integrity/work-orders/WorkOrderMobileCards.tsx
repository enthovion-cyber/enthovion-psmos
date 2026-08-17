'use client';

import Link from 'next/link';
import type { MiWorkOrderRow } from '../types/work-order.types';
import { cardValue } from '../safeguards/SafeguardUiPrimitives';
import { WorkOrderStatusBadge } from '../shared/WorkOrderStatusBadge';
import { WorkPriorityBadge } from '../shared/WorkPriorityBadge';
import { ReadinessImpactBadge } from '../shared/ReadinessImpactBadge';

export function WorkOrderMobileCards({ rows = [] }: { rows?: MiWorkOrderRow[] | undefined }) {
  if (!rows.length) return null;
  return (
    <div className="grid gap-3 lg:hidden">
      {rows.map((row) => (
        <Link key={row.id} href={`/mechanical-integrity/work-orders/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div><p className="font-semibold">{cardValue(row.work_order_number)} - {cardValue(row.title)}</p><p className="mt-1 text-sm text-[var(--psm-muted)]">{cardValue(row.equipment_tag ?? row.equipment_id)} · {cardValue(row.work_order_type)}</p></div>
            <WorkOrderStatusBadge status={row.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2"><WorkPriorityBadge priority={row.priority} /><ReadinessImpactBadge impact={row.readiness_impact} blocked={row.startup_blocker} /></div>
        </Link>
      ))}
    </div>
  );
}
