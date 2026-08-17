'use client';

export function InspectionRecordFilters({ filters, onChange }: { filters: Record<string, string>; onChange: (next: Record<string, string>) => void }) {
  const set = (key: string, value: string) => onChange({ ...filters, [key]: value });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-5">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" placeholder="Search record, equipment, inspector" value={filters.search ?? ''} onChange={(event) => set('search', event.target.value)} />
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" value={filters.status ?? ''} onChange={(event) => set('status', event.target.value)}>
          <option value="">All statuses</option>
          {['Draft','In Progress','Submitted for Review','Approved','Rejected','Archived'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" value={filters.result ?? ''} onChange={(event) => set('result', event.target.value)}>
          <option value="">All results</option>
          {['Pass','Pass with Recommendations','Conditional Acceptance','Fail','Engineering Review Required','Not Evaluated'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" type="date" value={filters.dateFrom ?? ''} onChange={(event) => set('dateFrom', event.target.value)} />
        <button className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold text-[var(--psm-text)]" onClick={() => onChange({})}>Clear Filters</button>
      </div>
    </section>
  );
}
