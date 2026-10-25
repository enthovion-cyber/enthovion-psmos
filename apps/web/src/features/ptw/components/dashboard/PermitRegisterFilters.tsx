import { Filter, RotateCcw, Search } from 'lucide-react';
import type { PTWRegisterFilters } from '../../services/ptw-dashboard.service';

const statuses = ['', 'Active', 'Submitted', 'Issued', 'Suspended', 'Closed', 'Cancelled'];
const permitTypes = ['', 'HOT_WORK', 'COLD_WORK', 'CONFINED_SPACE', 'ELECTRICAL_ISOLATION', 'EXCAVATION', 'RADIOGRAPHY', 'WORKING_AT_HEIGHT', 'LINE_BREAKING', 'SIMOPS'];
const risks = ['', 'Low', 'Medium', 'High', 'Critical'];

const QUICK_FILTERS: Array<[string, Partial<PTWRegisterFilters>]> = [
  ['Active', { status: 'Active' }],
  ['Pending', { status: 'Submitted' }],
  ['Expiring', { expiringWithin: '2', status: '' }],
  ['Suspended', { status: 'Suspended' }],
  ['Closed', { status: 'Closed' }],
  ['History', { sort: 'created_at:desc' }]
];

export function PermitRegisterFilters({
  filters,
  onChange,
  onReset
}: {
  filters: PTWRegisterFilters;
  onChange: (filters: Partial<PTWRegisterFilters>) => void;
  onReset: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-3 shadow-sm dark:shadow-xl backdrop-blur-md">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-[1.5fr_140px_180px_130px_auto]">
        {/* Search input with leading icon */}
        <div className="relative flex items-center">
          <Search size={15} className="pointer-events-none absolute left-3 text-slate-400" />
          <input
            className="ptw-input pl-9"
            placeholder="Search permit number, title, equipment, holder, area..."
            value={filters.search ?? ''}
            onChange={(event) => onChange({ search: event.target.value })}
          />
        </div>

        {/* Status Dropdown */}
        <select
          className="ptw-input cursor-pointer"
          value={filters.status ?? ''}
          onChange={(event) => onChange({ status: event.target.value })}
        >
          {statuses.map((status) => (
            <option key={status || 'all'} value={status}>
              {status || 'All statuses'}
            </option>
          ))}
        </select>

        {/* Permit Type Dropdown */}
        <select
          className="ptw-input cursor-pointer"
          value={filters.permitType ?? ''}
          onChange={(event) => onChange({ permitType: event.target.value })}
        >
          {permitTypes.map((type) => (
            <option key={type || 'all'} value={type}>
              {type ? type.replaceAll('_', ' ') : 'All permit types'}
            </option>
          ))}
        </select>

        {/* Risk Level Dropdown */}
        <select
          className="ptw-input cursor-pointer"
          value={filters.riskLevel ?? ''}
          onChange={(event) => onChange({ riskLevel: event.target.value })}
        >
          {risks.map((risk) => (
            <option key={risk || 'all'} value={risk}>
              {risk || 'All risks'}
            </option>
          ))}
        </select>

        {/* Reset Button */}
        <button
          className="ptw-toolbar-button sm:col-span-2 md:col-span-1"
          onClick={onReset}
          type="button"
          title="Reset all filters"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Quick filter pills */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
          <Filter size={11} /> Quick View:
        </span>
        {QUICK_FILTERS.map(([label, patch]) => {
          const isActive =
            (patch.status && filters.status === patch.status) ||
            (patch.expiringWithin && filters.expiringWithin === patch.expiringWithin);

          return (
            <button
              key={label}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => onChange(patch)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
