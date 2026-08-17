'use client';

type Props = {
  title?: string | undefined;
  subtitle?: string | undefined;
  lastUpdated?: string | undefined;
  onRefresh?: (() => void) | undefined;
};

export function MiHistoryHeader({ title = 'Mechanical Integrity History', subtitle, lastUpdated, onRefresh }: Props) {
  return (
    <header className="rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--psm-muted)]">Audit ready timeline</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--psm-text)]">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--psm-muted)]">
            {subtitle ?? 'Equipment lifecycle, inspections, testing, deficiencies, work orders, approvals, document changes, exports, and system generated events from the MI audit trail.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--psm-line)] px-3 py-1 text-xs text-[var(--psm-muted)]">
            Updated {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'not yet loaded'}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg bg-[var(--psm-accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
}
