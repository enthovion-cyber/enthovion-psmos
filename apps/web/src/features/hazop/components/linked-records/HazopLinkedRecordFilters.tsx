import type { HazopLinkedRecordContext, HazopLinkedRecordFilters as FilterState } from '../../types/hazop-linked-record.types';

export function HazopLinkedRecordFilters({ filters, context, onChange }: { filters: FilterState; context?: HazopLinkedRecordContext; onChange: (filters: FilterState) => void }) {
  const set = (key: keyof FilterState, value: string) => onChange({ ...filters, [key]: value });
  return (
    <div className="grid gap-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 lg:grid-cols-[1fr_180px_220px_180px]">
      <input className="input" value={filters.search ?? ''} placeholder="Search linked records, numbers, notes..." onChange={(e) => set('search', e.target.value)} />
      <select className="input" value={filters.module ?? 'All'} onChange={(e) => set('module', e.target.value)}>
        <option>All</option>
        {(context?.modules ?? []).map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className="input" value={filters.relationshipType ?? 'All'} onChange={(e) => set('relationshipType', e.target.value)}>
        <option>All</option>
        {(context?.relationshipTypes ?? []).map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className="input" value={filters.blockingStatus ?? 'All'} onChange={(e) => set('blockingStatus', e.target.value)}>
        <option>All</option><option>Blocking</option><option>Needs Review</option><option>Not Blocking</option>
      </select>
    </div>
  );
}
