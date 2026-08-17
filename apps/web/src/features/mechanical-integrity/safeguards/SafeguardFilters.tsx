'use client';

export function SafeguardFilters({ value, onChange }: { value: Record<string, string>; onChange: (value: Record<string, string>) => void }) {
  return (
    <section className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-4">
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search tag, name, equipment" value={value.search ?? ''} onChange={(event) => onChange({ ...value, search: event.target.value })} />
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={value.status ?? ''} onChange={(event) => onChange({ ...value, status: event.target.value })}>
        <option value="">All statuses</option>
        <option value="Active">Active</option>
        <option value="Degraded">Degraded</option>
        <option value="Out of Service">Out of Service</option>
        <option value="Archived">Archived</option>
      </select>
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={value.dueStatus ?? ''} onChange={(event) => onChange({ ...value, dueStatus: event.target.value })}>
        <option value="">All due statuses</option>
        <option value="Due Soon">Due Soon</option>
        <option value="Overdue">Overdue</option>
        <option value="Not Scheduled">Not Scheduled</option>
      </select>
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={value.safetyCritical ?? ''} onChange={(event) => onChange({ ...value, safetyCritical: event.target.value })}>
        <option value="">All criticality</option>
        <option value="true">Safety critical</option>
        <option value="false">Non safety critical</option>
      </select>
    </section>
  );
}
