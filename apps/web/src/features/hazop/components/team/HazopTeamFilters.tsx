'use client';

import type { HazopTeamFilters as FilterState } from '../../types/hazop-team.types';

export function HazopTeamFilters({ filters, context, onChange, onExport, exporting }: { filters: FilterState; context?: any; onChange: (filters: FilterState) => void; onExport?: (() => void) | undefined; exporting?: boolean | undefined }) {
  const set = (key: keyof FilterState, value: string) => onChange({ ...filters, [key]: value });
  return (
    <section className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 lg:grid-cols-[1fr_repeat(5,160px)_auto]">
      <input className="input" placeholder="Search member, email, role..." value={filters.search ?? ''} onChange={(e) => set('search', e.target.value)} />
      <Select value={filters.discipline} onChange={(v) => set('discipline', v)} options={['All', ...(context?.disciplines ?? [])]} />
      <Select value={filters.studyRole} onChange={(v) => set('studyRole', v)} options={['All', ...(context?.studyRoles ?? [])]} />
      <Select value={filters.status} onChange={(v) => set('status', v)} options={['All', 'Invited', 'Active', 'Declined', 'Removed', 'Replaced', 'Inactive']} />
      <Select value={filters.requiredAttendance} onChange={(v) => set('requiredAttendance', v)} options={['All', 'Yes', 'No']} />
      <Select value={filters.signoffRequired} onChange={(v) => set('signoffRequired', v)} options={['All', 'Yes', 'No']} />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-xs"><input type="checkbox" checked={filters.attendanceMissing === 'true'} onChange={(e) => set('attendanceMissing', e.target.checked ? 'true' : '')} /> Missing attendance</label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-xs"><input type="checkbox" checked={filters.openActions === 'true'} onChange={(e) => set('openActions', e.target.checked ? 'true' : '')} /> Open actions</label>
      </div>
      <button onClick={onExport} disabled={!onExport || exporting} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold disabled:opacity-50">{exporting ? 'Exporting...' : 'Export'}</button>
    </section>
  );
}

function Select({ value, options, onChange }: { value?: string | undefined; options: string[]; onChange: (value: string) => void }) {
  return <select className="input" value={value ?? 'All'} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select>;
}
