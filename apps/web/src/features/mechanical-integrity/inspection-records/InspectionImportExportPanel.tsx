'use client';

export function InspectionImportExportPanel({ onImport, onExport, onTemplate }: { onImport: () => void; onExport: () => void; onTemplate: () => void }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <h2 className="font-bold text-[var(--psm-text)]">Import / Export</h2>
      <p className="mt-1 text-sm text-[var(--psm-muted)]">Use controlled imports for UT readings and export the inspection register for review packages.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)]" onClick={onTemplate}>Download Template</button>
        <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)]" onClick={onImport}>Import</button>
        <button className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white" onClick={onExport}>Export Index</button>
      </div>
    </section>
  );
}
