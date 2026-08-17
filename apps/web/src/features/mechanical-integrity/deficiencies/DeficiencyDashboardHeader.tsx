'use client';

import Link from 'next/link';
import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';

export function DeficiencyDashboardHeader({ lastUpdated, onRefresh }: { lastUpdated?: string | undefined; onRefresh?: (() => void) | undefined }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Mechanical Integrity</p>
          <h1 className="mt-1 text-2xl font-bold">Deficiency / Deviation Management</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">
            Manage inspection findings, failed tests, overdue requirements, temporary deviations, startup blockers, corrective links, verification, and equipment readiness impact.
          </p>
          {lastUpdated ? <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated {new Date(lastUpdated).toLocaleString()}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/mechanical-integrity/deficiencies/new"><PrimaryButton>Create Deficiency</PrimaryButton></Link>
          <Link href="/mechanical-integrity/deviations/new"><ActionButton>Create Deviation</ActionButton></Link>
          <Link href="/mechanical-integrity/deficiencies/critical"><ActionButton>View Critical</ActionButton></Link>
          <Link href="/mechanical-integrity/deficiencies/overdue"><ActionButton>View Overdue</ActionButton></Link>
          <a href="/api/v1/mechanical-integrity/deficiencies/export"><ActionButton>Export</ActionButton></a>
          <ActionButton onClick={onRefresh}>Refresh</ActionButton>
        </div>
      </div>
    </header>
  );
}
