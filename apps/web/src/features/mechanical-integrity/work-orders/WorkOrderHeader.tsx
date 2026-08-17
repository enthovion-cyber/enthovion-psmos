'use client';

import Link from 'next/link';
import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';

export function WorkOrderHeader({ lastUpdated, onRefresh }: { lastUpdated?: string | undefined; onRefresh?: (() => void) | undefined }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Mechanical Integrity</p>
          <h1 className="mt-1 text-2xl font-bold">Work Orders / Actions</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Plan, execute, verify, and close asset integrity repair and corrective work.</p>
          {lastUpdated ? <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated {new Date(lastUpdated).toLocaleString()}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/mechanical-integrity/work-orders/new"><PrimaryButton>Create Work Order</PrimaryButton></Link>
          <Link href="/mechanical-integrity/actions/new"><ActionButton>Create Action</ActionButton></Link>
          <Link href="/mechanical-integrity/actions/my-actions"><ActionButton>My Work</ActionButton></Link>
          <Link href="/mechanical-integrity/work-orders/overdue"><ActionButton>Overdue</ActionButton></Link>
          <a href="/api/v1/mechanical-integrity/work-orders/export"><ActionButton>Export</ActionButton></a>
          <ActionButton onClick={onRefresh}>Refresh</ActionButton>
        </div>
      </div>
    </header>
  );
}
