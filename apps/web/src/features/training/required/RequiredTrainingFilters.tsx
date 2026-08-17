export function RequiredTrainingFilters({ filters, onChange }: { filters: Record<string, string>; onChange: (filters: Record<string, string>) => void }) {
  const set = (key: string, value: string) => onChange({ ...filters, [key]: value });
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-4">
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search title, code, objective..." value={filters.search ?? ''} onChange={(e) => set('search', e.target.value)} />
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={filters.status ?? ''} onChange={(e) => set('status', e.target.value)}>
        <option value="">All statuses</option><option>Draft</option><option>Active</option><option>Approved Current</option><option>Pending Review</option><option>Review Overdue</option><option>Archived</option>
      </select>
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={filters.category ?? ''} onChange={(e) => set('category', e.target.value)}>
        <option value="">All categories</option><option>Site Induction</option><option>Process Safety Management</option><option>Chemical / SDS Awareness</option><option>PTW</option><option>SOP / Procedure</option><option>Mechanical Integrity</option><option>Other</option>
      </select>
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={filters.matrixSyncStatus ?? ''} onChange={(e) => set('matrixSyncStatus', e.target.value)}>
        <option value="">All matrix states</option><option>Not Linked</option><option>Linked</option><option>Sync Required</option><option>In Sync</option><option>Out of Sync</option>
      </select>
    </div>
  );
}
