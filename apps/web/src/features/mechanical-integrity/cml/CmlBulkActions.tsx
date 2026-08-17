'use client';

export function CmlBulkActions({ selectedCount, onExport, onRecalculate, recalculating }: { selectedCount: number; onExport: () => void; onRecalculate: () => void; recalculating?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-[var(--psm-muted)]">{selectedCount ? `${selectedCount} CML/TML records selected` : 'Bulk actions apply to the current server-filtered registry.'}</p>
      <div className="flex flex-wrap gap-2">
        <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]" onClick={onRecalculate} disabled={recalculating}>{recalculating ? 'Recalculating...' : 'Recalculate Filtered'}</button>
        <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]" onClick={onExport}>Export Registry CSV</button>
      </div>
    </div>
  );
}
