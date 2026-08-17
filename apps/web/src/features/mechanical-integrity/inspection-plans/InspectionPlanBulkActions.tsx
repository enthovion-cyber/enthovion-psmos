export function InspectionPlanBulkActions({ selectedCount, onExport, onRunScheduler, running }: { selectedCount: number; onExport: () => void; onRunScheduler: () => void; running?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 text-sm">
      <span className="text-[var(--psm-muted)]">{selectedCount} selected</span>
      <div className="flex gap-2">
        <button onClick={onRunScheduler} disabled={running} className="rounded-lg border border-info/40 px-3 py-1.5 font-semibold text-info disabled:opacity-50">{running ? 'Running...' : 'Run scheduler'}</button>
        <button onClick={onExport} className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 font-semibold text-[var(--psm-text)]">Export list</button>
      </div>
    </div>
  );
}
