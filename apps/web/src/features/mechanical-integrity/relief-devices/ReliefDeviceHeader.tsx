'use client';

import Link from 'next/link';

export function ReliefDeviceHeader({ lastUpdated, onRunScheduler }: { lastUpdated?: string; onRunScheduler?: () => void }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-info">Mechanical Integrity</p>
          <h1 className="text-2xl font-bold">PSV / Relief Device Management</h1>
          <p className="text-sm text-[var(--psm-muted)]">Registry, protection coverage, technical data, relief basis, testing, certificates, seals, and readiness.</p>
          {lastUpdated ? <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated {new Date(lastUpdated).toLocaleString()}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/mechanical-integrity/relief-devices/new" className="rounded-lg bg-info px-3 py-2 text-sm font-semibold text-white">New relief device</Link>
          <Link href="/mechanical-integrity/relief-devices/tests/new" className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold">New test record</Link>
          <Link href="/mechanical-integrity/relief-devices/import" className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold">Import</Link>
          <button type="button" onClick={onRunScheduler} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold">Run scheduler</button>
        </div>
      </div>
    </header>
  );
}
