'use client';

export function InspectionPlanFilters({ filters, onChange }: { filters: Record<string, string>; onChange: (filters: Record<string, string>) => void }) {
  const set = (key: string, value: string) => onChange({ ...filters, [key]: value });
  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <input value={filters.search ?? ''} onChange={(e) => set('search', e.target.value)} placeholder="Search plan, title, method" className="rounded-lg border border-[var(--psm-line)] bg-transparent px-3 py-2 text-sm text-[var(--psm-text)]" />
        <select value={filters.status ?? ''} onChange={(e) => set('status', e.target.value)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-sm text-[var(--psm-text)]"><option value="">All statuses</option><option>Draft</option><option>Pending Review</option><option>Approved</option><option>Active</option><option>Revision Required</option><option>Archived</option></select>
        <select value={filters.dueStatus ?? ''} onChange={(e) => set('dueStatus', e.target.value)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-sm text-[var(--psm-text)]"><option value="">All due statuses</option><option>Not Scheduled</option><option>Not Due</option><option>Due Soon</option><option>Due</option><option>Overdue</option><option>Critical Overdue</option><option>Blocked</option></select>
        <select value={filters.planType ?? ''} onChange={(e) => set('planType', e.target.value)} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-2 text-sm text-[var(--psm-text)]"><option value="">All plan types</option><option>Visual Inspection Plan</option><option>CML/TML Inspection Plan</option><option>PSV / Relief Device Test Plan</option><option>SIS / SIF Proof Test Plan foundation</option><option>RBI-based Inspection Plan</option></select>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm text-[var(--psm-text)]"><input type="checkbox" checked={filters.overdue === 'true'} onChange={(e) => set('overdue', e.target.checked ? 'true' : '')} /> Overdue</label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm text-[var(--psm-text)]"><input type="checkbox" checked={filters.remainingLife === 'true'} onChange={(e) => set('remainingLife', e.target.checked ? 'true' : '')} /> Remaining life</label>
      </div>
    </div>
  );
}
