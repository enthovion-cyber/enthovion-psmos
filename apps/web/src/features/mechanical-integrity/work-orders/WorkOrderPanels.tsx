'use client';

import Link from 'next/link';
import type { MiWorkOrderRow } from '../types/work-order.types';
import { SectionCard, cardValue } from '../safeguards/SafeguardUiPrimitives';
import { WorkOrderStatusBadge } from '../shared/WorkOrderStatusBadge';
import { WorkPriorityBadge } from '../shared/WorkPriorityBadge';
import { ReadinessImpactBadge } from '../shared/ReadinessImpactBadge';

function List({ rows, empty }: { rows: MiWorkOrderRow[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-[var(--psm-muted)]">{empty}</p>;
  return (
    <div className="space-y-2">
      {rows.slice(0, 6).map((row) => (
        <Link key={row.id} href={`/mechanical-integrity/work-orders/${row.id}`} className="block rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{cardValue(row.work_order_number)} - {cardValue(row.title)}</p>
              <p className="mt-1 text-xs text-[var(--psm-muted)]">{cardValue(row.equipment_tag ?? row.equipment_id)} · {cardValue(row.source_module ?? 'Manual')}</p>
            </div>
            <WorkOrderStatusBadge status={row.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <WorkPriorityBadge priority={row.priority} />
            <ReadinessImpactBadge impact={row.readiness_impact} blocked={row.startup_blocker} />
          </div>
        </Link>
      ))}
    </div>
  );
}

export function WorkOrderCriticalPanel({ rows = [] }: { rows?: MiWorkOrderRow[] | undefined }) {
  return <SectionCard title="Critical Work Panel" description="Critical, emergency, safety-critical, and PSM-critical work."><List rows={rows.filter((row) => row.risk_level === 'Critical' || row.priority === 'Emergency' || row.safety_critical_work || row.psm_critical_work)} empty="No critical work in the current filter." /></SectionCard>;
}

export function WorkOrderOverduePanel({ rows = [] }: { rows?: MiWorkOrderRow[] | undefined }) {
  const today = new Date();
  return <SectionCard title="Overdue Work Panel" description="Open work orders past their due date."><List rows={rows.filter((row) => row.due_date && new Date(row.due_date) < today && !['Closed','Rejected','Cancelled'].includes(String(row.status)))} empty="No overdue work in the current filter." /></SectionCard>;
}

export function ReadinessBlockerPanel({ rows = [] }: { rows?: MiWorkOrderRow[] | undefined }) {
  return <SectionCard title="Readiness Blocker Panel" description="Startup blockers, MOC/PSSR impacts, and readiness affecting work."><List rows={rows.filter((row) => row.startup_blocker || row.moc_required || row.readiness_impact || row.required_shutdown)} empty="No readiness blocker work in the current filter." /></SectionCard>;
}

export function MyWorkPanel({ rows = [] }: { rows?: MiWorkOrderRow[] | undefined }) {
  return <SectionCard title="My Work Panel" description="Assigned and owner work from current filtered result set."><List rows={rows.filter((row) => !!row.assigned_user_id || !!row.owner_user_id)} empty="No assigned work in the current filter." /></SectionCard>;
}
