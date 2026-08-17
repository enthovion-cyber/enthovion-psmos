'use client';

import Link from 'next/link';
import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';

export function ReadinessHeader({ lastUpdated, onRefresh }: { lastUpdated?: string | undefined; onRefresh?: (() => void) | undefined }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Mechanical Integrity</p>
          <h1 className="mt-1 text-2xl font-bold">Fitness-for-Service / Readiness</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">
            Backend-controlled readiness decisions across inspections, deficiencies, safeguards, PSV testing, work orders, certificates, PSSR, MOC, and temporary deviations.
          </p>
          <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Not loaded'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/mechanical-integrity/readiness/assessments/new"><PrimaryButton>New Assessment</PrimaryButton></Link>
          <Link href="/mechanical-integrity/readiness/import"><ActionButton>Import</ActionButton></Link>
          <a href="/api/v1/mechanical-integrity/readiness/export"><ActionButton>Export</ActionButton></a>
          <ActionButton onClick={onRefresh}>Refresh</ActionButton>
        </div>
      </div>
    </header>
  );
}
