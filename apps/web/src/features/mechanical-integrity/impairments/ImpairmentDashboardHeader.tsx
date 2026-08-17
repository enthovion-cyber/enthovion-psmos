'use client';

import Link from 'next/link';
import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';

export function ImpairmentDashboardHeader({ lastUpdated }: { lastUpdated?: string | null | undefined }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--psm-muted)]">Mechanical Integrity</p>
          <h1 className="mt-1 text-2xl font-bold">Safeguard Bypass / Impairment Log</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Central control log for temporary bypass, impairment, override, inhibit, defeat, isolation, and unavailability of safety-critical safeguards.</p>
          {lastUpdated ? <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated {new Date(lastUpdated).toLocaleString()}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/mechanical-integrity/bypass-impairments/new"><PrimaryButton>Create Impairment</PrimaryButton></Link>
          <Link href="/mechanical-integrity/bypass-impairments/active"><ActionButton>View Active</ActionButton></Link>
          <Link href="/mechanical-integrity/bypass-impairments/expired"><ActionButton>View Expired</ActionButton></Link>
          <Link href="/mechanical-integrity/bypass-impairments/pending-approval"><ActionButton>Pending Approval</ActionButton></Link>
          <ActionButton onClick={() => window.open('/api/v1/mechanical-integrity/bypass-impairments/export', '_blank')}>Export</ActionButton>
          <ActionButton onClick={() => window.location.reload()}>Refresh</ActionButton>
        </div>
      </div>
    </header>
  );
}
