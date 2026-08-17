'use client';

export function WorkforceFilters({ filters, onChange }: { filters: Record<string, any>; onChange: (next: Record<string, any>) => void }) {
  const patch = (next: Record<string, any>) => onChange({ ...filters, ...next, page: 1 });
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 md:grid-cols-4">
      <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search name, email, ID, badge" value={filters.search ?? ''} onChange={(e) => patch({ search: e.target.value })} />
      <Select value={filters.workerType ?? ''} onChange={(workerType) => patch({ workerType })} items={['', 'Employee', 'Contractor', 'Vendor', 'Trainee', 'Visitor', 'Auditor']} label="Worker type" />
      <Select value={filters.trainingStatus ?? ''} onChange={(trainingStatus) => patch({ trainingStatus })} items={['', 'Not Assessed', 'Complete', 'Incomplete', 'Overdue', 'Expiring Soon', 'Pending Verification', 'Blocked']} label="Training status" />
      <Select value={filters.reviewStatus ?? ''} onChange={(reviewStatus) => patch({ reviewStatus })} items={['', 'Not Reviewed', 'Pending Review', 'Approved', 'Returned', 'Rejected']} label="Review status" />
    </div>
  );
}

function Select({ label, value, items, onChange }: { label: string; value: string; items: string[]; onChange: (value: string) => void }) {
  return <select aria-label={label} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>{items.map((item) => <option key={item} value={item}>{item || label}</option>)}</select>;
}
