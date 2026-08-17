'use client';

export function InspectionPlanHeader({ onAdd, onImport, onExport, onRunScheduler, schedulerRunning }: { onAdd: () => void; onImport: () => void; onExport: () => void; onRunScheduler: () => void; schedulerRunning?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--psm-text)]">Inspection Plans / ITP</h1>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">Plan, schedule, and govern asset integrity inspections</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onAdd} className="rounded-lg bg-info px-4 py-2 text-sm font-bold text-white">Add Inspection Plan</button>
          <button onClick={onImport} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold text-[var(--psm-text)]">Import Plans</button>
          <button onClick={onExport} className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold text-[var(--psm-text)]">Export Plans</button>
          <button onClick={onRunScheduler} disabled={schedulerRunning} className="rounded-lg border border-info/40 px-4 py-2 text-sm font-semibold text-info disabled:opacity-50">{schedulerRunning ? 'Running...' : 'Run Scheduler'}</button>
          <a href="/mechanical-integrity/inspection-scheduler/due" className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold text-[var(--psm-text)]">View Due Inspections</a>
          <a href="/mechanical-integrity/inspection-scheduler/overdue" className="rounded-lg border border-[var(--psm-line)] px-4 py-2 text-sm font-semibold text-[var(--psm-text)]">View Overdue</a>
        </div>
      </div>
    </div>
  );
}
