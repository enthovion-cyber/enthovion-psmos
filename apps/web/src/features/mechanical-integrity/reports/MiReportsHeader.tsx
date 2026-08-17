'use client';

export function MiReportsHeader({ lastUpdated, onRefresh }: { lastUpdated?: string | undefined; onRefresh?: (() => void) | undefined }) {
  return (
    <header className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--psm-muted)]">Report center</p>
          <h1 className="mt-1 text-2xl font-semibold">Mechanical Integrity Reports</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">
            Build, schedule, generate, preview, and export MI reports from real equipment, inspection, PSV/SIF, deficiencies, work orders, readiness, and approval data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[var(--psm-line)] px-3 py-1 text-xs text-[var(--psm-muted)]">Updated {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'not loaded'}</span>
          <button type="button" onClick={onRefresh} className="rounded-lg bg-[var(--psm-accent)] px-4 py-2 text-sm font-semibold text-white">Refresh</button>
        </div>
      </div>
    </header>
  );
}
