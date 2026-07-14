'use client';

import type { HazopSessionFilters as FilterState } from '../../types/hazop-session.types';

export function HazopSessionFilters({ filters, context, onChange }: { filters: FilterState; context?: any; onChange: (filters: FilterState) => void }) {
  const set = (key: keyof FilterState, value: string) => onChange({ ...filters, [key]: value });
  return (
    <section className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 lg:grid-cols-[1fr_repeat(4,160px)]">
      <input className="input" placeholder="Search sessions, agenda, minutes..." value={filters.search ?? ''} onChange={(e) => set('search', e.target.value)} />
      <Select value={filters.status} onChange={(v) => set('status', v)} options={['All', 'Planned', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled', 'Missed']} />
      <Select value={filters.sessionType} onChange={(v) => set('sessionType', v)} options={['All', ...(context?.sessionTypes ?? [])]} />
      <Select value={filters.facilitatorId} onChange={(v) => set('facilitatorId', v)} options={['All', ...(context?.users ?? []).map((u: any) => u.id)]} labels={Object.fromEntries((context?.users ?? []).map((u: any) => [u.id, u.displayName]))} />
      <Select value={filters.nodeId} onChange={(v) => set('nodeId', v)} options={['All', ...(context?.nodes ?? []).map((n: any) => n.id)]} labels={Object.fromEntries((context?.nodes ?? []).map((n: any) => [n.id, `${n.node_number} ${n.title}`]))} />
      <input type="date" className="input" value={filters.dateFrom ?? ''} onChange={(e) => set('dateFrom', e.target.value)} />
      <input type="date" className="input" value={filters.dateTo ?? ''} onChange={(e) => set('dateTo', e.target.value)} />
      <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-xs"><input type="checkbox" checked={filters.attendanceIncomplete === 'true'} onChange={(e) => set('attendanceIncomplete', e.target.checked ? 'true' : '')} /> Attendance incomplete</label>
      <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-xs"><input type="checkbox" checked={filters.minutesMissing === 'true'} onChange={(e) => set('minutesMissing', e.target.checked ? 'true' : '')} /> Minutes missing</label>
      <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] px-3 py-2 text-xs"><input type="checkbox" checked={filters.openActions === 'true'} onChange={(e) => set('openActions', e.target.checked ? 'true' : '')} /> Open actions</label>
    </section>
  );
}

function Select({ value, options, labels = {}, onChange }: { value?: string | undefined; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return <select className="input" value={value ?? 'All'} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{labels[option] ?? option}</option>)}</select>;
}
