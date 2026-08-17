'use client';

export function ReliefDeviceFilters({ value, onChange }: { value: Record<string, string>; onChange: (value: Record<string, string>) => void }) {
  return (
    <section className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-4">
      <input className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-sm" placeholder="Search tag, name, fluid" value={value.search ?? ''} onChange={(event) => onChange({ ...value, search: event.target.value })} />
      <select className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-sm" value={value.status ?? ''} onChange={(event) => onChange({ ...value, status: event.target.value })}>
        <option value="">All statuses</option>
        {['Active', 'In Service', 'Out of Service', 'Under Maintenance', 'Impaired', 'Bypassed', 'Startup Blocked', 'Archived'].map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-sm" value={value.dueStatus ?? ''} onChange={(event) => onChange({ ...value, dueStatus: event.target.value })}>
        <option value="">All due statuses</option>
        {['Scheduled', 'Due Soon', 'Overdue', 'Not Scheduled'].map((item) => <option key={item}>{item}</option>)}
      </select>
      <button type="button" className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold" onClick={() => onChange({})}>Clear filters</button>
    </section>
  );
}
