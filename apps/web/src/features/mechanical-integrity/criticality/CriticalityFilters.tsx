'use client';

export function CriticalityFilters({ filters, onChange }: { filters: Record<string, string>; onChange: (filters: Record<string, string>) => void }) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
      <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Search assessment" value={filters.q ?? ''} onChange={(event) => onChange({ ...filters, q: event.target.value })} />
      <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={filters.status ?? ''} onChange={(event) => onChange({ ...filters, status: event.target.value })}>
        <option value="">All statuses</option>
        {['Draft', 'Pending Review', 'Approved', 'Returned for Correction', 'Rejected', 'Archived', 'Superseded'].map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={filters.category ?? ''} onChange={(event) => onChange({ ...filters, category: event.target.value })}>
        <option value="">All categories</option>
        {['Low', 'Medium', 'High', 'Critical'].map((item) => <option key={item}>{item}</option>)}
      </select>
      <button className="rounded-md border border-border px-3 py-2 text-sm" onClick={() => onChange({})}>Clear</button>
    </div>
  );
}
