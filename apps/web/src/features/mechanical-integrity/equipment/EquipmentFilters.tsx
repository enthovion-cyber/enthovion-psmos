import { Search } from 'lucide-react';
import type { MiEquipmentFilters } from '../services/equipment.service';

export function EquipmentFilters({ filters, onChange }: { filters: MiEquipmentFilters; onChange: (filters: MiEquipmentFilters) => void }) {
  const update = (key: keyof MiEquipmentFilters, value: string) => {
    const next: MiEquipmentFilters = { ...filters, page: 1 };
    if (value) next[key] = value as never;
    else delete next[key];
    onChange(next);
  };
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="grid gap-3 lg:grid-cols-[2fr_repeat(4,1fr)]">
        <label className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]" />
          <input className="psm-input w-full pl-9" placeholder="Search tag, name, serial, model, service..." value={filters.q ?? ''} onChange={(event) => update('q', event.target.value)} />
        </label>
        <select className="psm-input" value={filters.status ?? ''} onChange={(event) => update('status', event.target.value)}>
          <option value="">All statuses</option><option value="ACTIVE">Active</option><option value="OUT_OF_SERVICE">Out of Service</option><option value="DECOMMISSIONED">Decommissioned</option>
        </select>
        <select className="psm-input" value={filters.criticality ?? ''} onChange={(event) => update('criticality', event.target.value)}>
          <option value="">All criticalities</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="SAFETY_CRITICAL">Safety Critical</option>
        </select>
        <select className="psm-input" value={filters.safetyCritical ?? ''} onChange={(event) => update('safetyCritical', event.target.value)}>
          <option value="">Safety critical any</option><option value="true">Safety critical only</option>
        </select>
        <select className="psm-input" value={filters.sort ?? 'tag.asc'} onChange={(event) => onChange({ ...filters, sort: event.target.value })}>
          <option value="tag.asc">Tag A-Z</option><option value="tag.desc">Tag Z-A</option><option value="updatedAt.desc">Recently updated</option>
        </select>
      </div>
    </section>
  );
}
