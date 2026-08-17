'use client';

export function CriticalityHeader({ onNew, onExport, onConfig }: { onNew: () => void; onExport: () => void; onConfig: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-foreground">MI Criticality / Risk Ranking</h1>
        <p className="text-sm text-muted-foreground">Equipment criticality assessments, risk drivers, review queue, and configured scoring basis.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="rounded-md border border-border px-3 py-2 text-sm" onClick={onConfig}>Config</button>
        <button className="rounded-md border border-border px-3 py-2 text-sm" onClick={onExport}>Export</button>
        <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground" onClick={onNew}>New Assessment</button>
      </div>
    </div>
  );
}
