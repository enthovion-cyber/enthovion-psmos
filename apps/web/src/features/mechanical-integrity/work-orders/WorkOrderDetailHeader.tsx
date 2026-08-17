'use client';

import Link from 'next/link';
import type { MiWorkOrderDetailResponse } from '../types/work-order.types';
import { ActionButton, PrimaryButton, cardValue } from '../safeguards/SafeguardUiPrimitives';
import { WorkOrderStatusBadge } from '../shared/WorkOrderStatusBadge';
import { WorkPriorityBadge } from '../shared/WorkPriorityBadge';
import { ReadinessImpactBadge } from '../shared/ReadinessImpactBadge';

export function WorkOrderDetailHeader({ detail, busy, actions }: { detail: MiWorkOrderDetailResponse; busy?: boolean; actions: Record<string, () => void> }) {
  const row = detail.workOrder;
  const disabledReason = row.read_only ? 'Closed/rejected/cancelled work orders are read-only.' : undefined;
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Work Order Detail</p>
          <h1 className="mt-1 text-2xl font-bold">{cardValue(row.work_order_number)} - {cardValue(row.title)}</h1>
          <p className="mt-2 text-sm text-[var(--psm-muted)]">{cardValue(row.description, 'No description recorded.')}</p>
          <div className="mt-3 flex flex-wrap gap-2"><WorkOrderStatusBadge status={row.status} /><WorkPriorityBadge priority={row.priority} /><ReadinessImpactBadge impact={row.readiness_impact} blocked={row.startup_blocker} /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/mechanical-integrity/work-orders/${row.id}/edit`}><ActionButton disabled={Boolean(row.read_only)} title={disabledReason}>Edit</ActionButton></Link>
          <ActionButton onClick={actions.submit} disabled={busy || Boolean(row.read_only)} title={disabledReason}>Submit</ActionButton>
          <PrimaryButton onClick={actions.approve} disabled={busy || Boolean(row.read_only)} title={disabledReason}>Approve</PrimaryButton>
          <ActionButton onClick={actions.start} disabled={busy || Boolean(row.read_only)} title={disabledReason}>Start Work</ActionButton>
          <ActionButton onClick={actions.hold} disabled={busy || Boolean(row.read_only)} title={disabledReason}>Put On Hold</ActionButton>
          <ActionButton onClick={actions.resume} disabled={busy || Boolean(row.read_only)} title={disabledReason}>Resume</ActionButton>
          <ActionButton onClick={actions.close} disabled={busy || Boolean(row.read_only)} title={detail.readiness.blockers.join(' ') || disabledReason}>Close</ActionButton>
        </div>
      </div>
    </header>
  );
}
