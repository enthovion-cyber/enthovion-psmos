import type { HazopDashboardFilters } from '../../types/hazop-dashboard.types';

export function HazopDashboardFiltersPanel({
  filters,
  onFilter,
  onReset,
  activeCount,
}: {
  filters: HazopDashboardFilters;
  onFilter: <K extends keyof HazopDashboardFilters>(key: K, value: HazopDashboardFilters[K]) => void;
  onReset: () => void;
  activeCount: number;
}) {
  const selectClass = 'h-10 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 text-sm outline-none';
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-8">
        <select className={selectClass} value={filters.status} onChange={(event) => onFilter('status', event.target.value)}>
          <option value="">All statuses</option>
          {['Draft', 'Planned', 'In Preparation', 'In Progress', 'In Review', 'Pending Approval', 'Approved', 'Closed', 'Reopened', 'Cancelled', 'Overdue'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className={selectClass} value={filters.studyType} onChange={(event) => onFilter('studyType', event.target.value)}>
          <option value="">All study types</option>
          {['HAZOP', 'What-If', 'Checklist PHA', 'What-If/Checklist', 'FMEA', 'Bowtie', 'Revalidation', 'MOC-triggered', 'PSSR-triggered', 'Incident-triggered'].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className={selectClass} value={filters.riskPriority} onChange={(event) => onFilter('riskPriority', event.target.value)}>
          <option value="">All risk priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 text-sm"><input type="checkbox" checked={filters.overdue} onChange={(event) => onFilter('overdue', event.target.checked)} /> Overdue</label>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 text-sm"><input type="checkbox" checked={filters.lopaRequired} onChange={(event) => onFilter('lopaRequired', event.target.checked)} /> LOPA</label>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 text-sm"><input type="checkbox" checked={filters.pendingSignoff} onChange={(event) => onFilter('pendingSignoff', event.target.checked)} /> Sign-off</label>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 text-sm"><input type="checkbox" checked={filters.revalidationDue} onChange={(event) => onFilter('revalidationDue', event.target.checked)} /> Revalidation</label>
        <button type="button" onClick={onReset} className="h-10 rounded-lg border border-[var(--psm-line)] px-3 text-sm font-semibold hover:bg-[var(--psm-surface-2)]">Reset {activeCount ? `(${activeCount})` : ''}</button>
      </div>
    </section>
  );
}
