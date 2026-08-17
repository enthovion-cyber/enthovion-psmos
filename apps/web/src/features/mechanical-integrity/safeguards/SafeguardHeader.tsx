'use client';

import { useRouter } from 'next/navigation';
import { ActionButton, PrimaryButton } from './SafeguardUiPrimitives';

export function SafeguardHeader({ lastUpdated, onRunScheduler, schedulerRunning }: { lastUpdated?: string; onRunScheduler?: () => void; schedulerRunning?: boolean }) {
  const router = useRouter();
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">Mechanical Integrity</p>
          <h1 className="mt-1 text-2xl font-bold">SIS / SIF / Interlocks / Critical Alarms</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">Unified safeguard lifecycle, testing, demand, bypass, readiness, LOPA/SIL, PSSR, and equipment integration.</p>
          <p className="mt-2 text-xs text-[var(--psm-muted)]">Last updated: {lastUpdated ?? 'Backend timestamp not available'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={() => router.push('/mechanical-integrity/sis/sifs/new')}>New SIF</PrimaryButton>
          <ActionButton onClick={() => router.push('/mechanical-integrity/interlocks/new')}>New Interlock</ActionButton>
          <ActionButton onClick={() => router.push('/mechanical-integrity/critical-alarms/new')}>New Alarm</ActionButton>
          <ActionButton onClick={() => router.push('/mechanical-integrity/safeguard-tests/new')}>New Test</ActionButton>
          <ActionButton onClick={onRunScheduler} disabled={schedulerRunning} title="Scheduler is already running">{schedulerRunning ? 'Running...' : 'Run Scheduler'}</ActionButton>
        </div>
      </div>
    </header>
  );
}
