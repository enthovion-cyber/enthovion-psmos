'use client';

export function SopAckFilters({ filters, onChange }: { filters: Record<string, any>; onChange: (filters: Record<string, any>) => void }) {
  const set = (key: string, value: string) => onChange({ ...filters, [key]: value || undefined });
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-4">
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search worker, SOP, document, requirement" value={filters.search ?? ''} onChange={(e) => set('search', e.target.value)} />
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Site ID" value={filters.siteId ?? ''} onChange={(e) => set('siteId', e.target.value)} />
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Worker ID / job role / department" value={filters.workerId ?? ''} onChange={(e) => set('workerId', e.target.value)} />
      <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={filters.verificationStatus ?? ''} onChange={(e) => set('verificationStatus', e.target.value)}>
        <option value="">Verification status</option>
        {['Not Required', 'Pending', 'Verified', 'Rejected', 'Returned', 'Overridden'].map((value) => <option key={value}>{value}</option>)}
      </select>
    </div>
  );
}
