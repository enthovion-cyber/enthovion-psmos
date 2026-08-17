'use client';

export function InspectionRecordHeader({ equipmentId, onAdd, onImport, onExport, onRefresh, refreshing }: { equipmentId?: string | undefined; onAdd: () => void; onImport: () => void; onExport: () => void; onRefresh?: (() => void) | undefined; refreshing?: boolean | undefined }) {
  return (
    <header className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Mechanical Integrity</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--psm-text)]">Inspection Records / UT Readings</h1>
          <p className="mt-1 max-w-3xl text-sm text-[var(--psm-muted)]">
            Execute inspections, enter CML/TML thickness readings, review findings, and update backend remaining-life calculations from approved readings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onRefresh ? <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)]" onClick={onRefresh}>{refreshing ? 'Refreshing...' : 'Refresh'}</button> : null}
          <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)]" onClick={onImport}>Import UT Readings</button>
          <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)]" onClick={onExport}>Export</button>
          <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white" onClick={onAdd}>{equipmentId ? 'New Equipment Inspection' : 'New Inspection Record'}</button>
        </div>
      </div>
    </header>
  );
}
