'use client';

export function CmlFilters({ filters, onChange }: { filters: Record<string, string>; onChange: (next: Record<string, string>) => void }) {
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:grid-cols-4">
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)] md:col-span-2" placeholder="Search CML number, location, component, damage mechanism" value={filters.q ?? ''} onChange={(event) => onChange({ ...filters, q: event.target.value })} />
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" value={filters.status ?? ''} onChange={(event) => onChange({ ...filters, status: event.target.value })}><option value="">All status</option><option>Active</option><option>Archived</option></select>
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm text-[var(--psm-text)]" value={filters.cmlType ?? ''} onChange={(event) => onChange({ ...filters, cmlType: event.target.value })}><option value="">All types</option><option>CML</option><option>TML</option><option>Injection Point</option><option>Deadleg</option></select>
    </div>
  );
}
