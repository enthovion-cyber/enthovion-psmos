'use client';

export function CmlHeader({ equipmentId, equipmentLabel, onAdd, onImport, onImportReadings, onExport, onRecalculate, recalculating }: { equipmentId: string; equipmentLabel?: string | null; onAdd: () => void; onImport: () => void; onImportReadings: () => void; onExport: () => void; onRecalculate: () => void; recalculating?: boolean }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--psm-muted)]">{equipmentLabel ?? `Equipment ${equipmentId}`}</p>
        <h2 className="text-2xl font-bold text-[var(--psm-text)]">CML / TML Registry</h2>
        <p className="text-sm text-[var(--psm-muted)]">Monitoring locations, thickness readings, corrosion rates, remaining life, next due dates, and alerts.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]" onClick={onRecalculate} disabled={recalculating}>{recalculating ? 'Recalculating...' : 'Recalculate All'}</button>
        <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]" onClick={onImport}>Import CML/TML</button>
        <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]" onClick={onImportReadings}>Import UT Readings</button>
        <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]" onClick={onExport}>Export</button>
        <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white" onClick={onAdd}>Add CML/TML</button>
      </div>
    </div>
  );
}
