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
  const selectClass =
    'h-9 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 text-xs text-[var(--psm-text)] outline-none transition focus:border-primary sm:h-10 sm:text-sm';

  const checkboxClass =
    'flex h-9 items-center gap-1.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-2.5 text-xs font-medium text-[var(--psm-text)] transition hover:bg-[var(--psm-surface)] cursor-pointer select-none sm:h-10 sm:text-sm';

  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
        <select
          className={selectClass}
          value={filters.status}
          onChange={(event) => onFilter('status', event.target.value)}
        >
          <option value="">All statuses</option>
          {[
            'Draft',
            'Planned',
            'In Preparation',
            'In Progress',
            'In Review',
            'Pending Approval',
            'Approved',
            'Closed',
            'Reopened',
            'Cancelled',
            'Overdue',
          ].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filters.studyType}
          onChange={(event) => onFilter('studyType', event.target.value)}
        >
          <option value="">All study types</option>
          {[
            'HAZOP',
            'What-If',
            'Checklist PHA',
            'What-If/Checklist',
            'FMEA',
            'Bowtie',
            'Revalidation',
            'MOC-triggered',
            'PSSR-triggered',
            'Incident-triggered',
          ].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className={selectClass}
          value={filters.riskPriority}
          onChange={(event) => onFilter('riskPriority', event.target.value)}
        >
          <option value="">All risk priorities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <label className={checkboxClass}>
          <input
            type="checkbox"
            className="accent-primary"
            checked={Boolean(filters.overdue)}
            onChange={(event) => onFilter('overdue', event.target.checked)}
          />
          <span>Overdue</span>
        </label>

        <label className={checkboxClass}>
          <input
            type="checkbox"
            className="accent-primary"
            checked={Boolean(filters.lopaRequired)}
            onChange={(event) => onFilter('lopaRequired', event.target.checked)}
          />
          <span>LOPA</span>
        </label>

        <label className={checkboxClass}>
          <input
            type="checkbox"
            className="accent-primary"
            checked={Boolean(filters.pendingSignoff)}
            onChange={(event) => onFilter('pendingSignoff', event.target.checked)}
          />
          <span>Sign-off</span>
        </label>

        <label className={checkboxClass}>
          <input
            type="checkbox"
            className="accent-primary"
            checked={Boolean(filters.revalidationDue)}
            onChange={(event) => onFilter('revalidationDue', event.target.checked)}
          />
          <span>Revalidation</span>
        </label>

        <button
          type="button"
          onClick={onReset}
          className="h-9 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 text-xs font-semibold text-[var(--psm-text)] transition hover:bg-[var(--psm-surface)] active:scale-95 sm:h-10 sm:text-sm"
        >
          Reset {activeCount ? `(${activeCount})` : ''}
        </button>
      </div>
    </section>
  );
}
