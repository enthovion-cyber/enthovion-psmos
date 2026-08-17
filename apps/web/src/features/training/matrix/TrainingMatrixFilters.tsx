'use client';

export function TrainingMatrixFilters({ filters, onChange }: { filters: Record<string, any>; onChange: (next: Record<string, any>) => void }) {
  const set = (key: string, value: string) => onChange({ ...filters, [key]: value || undefined, page: 1 });
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-4">
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search worker, rule, training..." value={filters.search ?? ''} onChange={(e) => set('search', e.target.value)} />
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Job role" value={filters.jobRole ?? ''} onChange={(e) => set('jobRole', e.target.value)} />
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={filters.workerType ?? ''} onChange={(e) => set('workerType', e.target.value)}><option value="">All worker types</option><option>Employee</option><option>Contractor</option><option>Vendor</option><option>Visitor</option><option>Trainee</option></select>
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={filters.gapSeverity ?? ''} onChange={(e) => set('gapSeverity', e.target.value)}><option value="">All severities</option><option>Info</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option><option>Work Blocker</option><option>Startup Blocker</option></select>
    </div>
  );
}
