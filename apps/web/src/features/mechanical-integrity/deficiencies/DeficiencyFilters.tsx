'use client';

import type { MiDeficiencyLookups } from '../types/deficiency.types';

export function DeficiencyFilters({ filters, lookups, savedViews, onChange }: { filters: Record<string, unknown>; lookups?: MiDeficiencyLookups | undefined; savedViews?: string[] | undefined; onChange: (next: Record<string, unknown>) => void }) {
  const update = (key: string, value: string) => onChange({ ...filters, page: 1, [key]: value || undefined });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search record, title, equipment" value={String(filters.search ?? '')} onChange={(event) => update('search', event.target.value)} />
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.status ?? '')} onChange={(event) => update('status', event.target.value)}>
          <option value="">All statuses</option>
          {(lookups?.deficiencyStatuses ?? []).map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.severity ?? '')} onChange={(event) => update('severity', event.target.value)}>
          <option value="">All severities</option>
          {(lookups?.severityLevels ?? []).map((severity) => <option key={severity} value={severity}>{severity}</option>)}
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.deficiencyType ?? '')} onChange={(event) => update('deficiencyType', event.target.value)}>
          <option value="">All types</option>
          {(lookups?.deficiencyTypes ?? []).map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.savedView ?? '')} onChange={(event) => update('savedView', event.target.value)}>
          <option value="">Saved views</option>
          {(savedViews ?? []).map((view) => <option key={view} value={view}>{view}</option>)}
        </select>
        <button type="button" onClick={() => onChange({ page: 1, limit: filters.limit ?? 25, sort: filters.sort ?? 'updated_at.desc' })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold">Clear Filters</button>
      </div>
    </section>
  );
}
