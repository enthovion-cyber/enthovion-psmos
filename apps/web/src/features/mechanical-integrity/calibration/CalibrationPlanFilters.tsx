'use client';

export function CalibrationPlanFilters({ filters, onChange }: { filters: Record<string, string>; onChange: (filters: Record<string, string>) => void }) {
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-4">
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2 text-sm" placeholder="Search calibration plans" value={filters.search ?? ''} onChange={(event) => onChange({ ...filters, search: event.target.value })} />
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2 text-sm" value={filters.status ?? ''} onChange={(event) => onChange({ ...filters, status: event.target.value })}><option value="">All statuses</option>{['Draft', 'Pending Approval', 'Active', 'Archived'].map((item) => <option key={item}>{item}</option>)}</select>
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-bg)] px-3 py-2 text-sm" value={filters.dueStatus ?? ''} onChange={(event) => onChange({ ...filters, dueStatus: event.target.value })}><option value="">All due states</option>{['Overdue', 'Due Soon', 'Scheduled', 'Not Scheduled'].map((item) => <option key={item}>{item}</option>)}</select>
      <button type="button" className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" onClick={() => onChange({})}>Reset</button>
    </div>
  );
}

