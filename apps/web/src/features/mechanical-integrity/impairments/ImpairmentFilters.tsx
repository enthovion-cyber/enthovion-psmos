'use client';

import type { MiImpairmentLookups } from '../types/impairment.types';

export function ImpairmentFilters({ filters, lookups, onChange, savedViews }: { filters: Record<string, unknown>; lookups?: MiImpairmentLookups | undefined; savedViews?: string[] | undefined; onChange: (filters: Record<string, unknown>) => void }) {
  const update = (key: string, value: string) => onChange({ ...filters, [key]: value || undefined, page: 1 });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search record, safeguard, equipment" value={String(filters.search ?? '')} onChange={(e) => update('search', e.target.value)} />
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.safeguardType ?? '')} onChange={(e) => update('safeguardType', e.target.value)}>
          <option value="">All safeguard types</option>
          {lookups?.safeguardTypes?.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.impairmentType ?? '')} onChange={(e) => update('impairmentType', e.target.value)}>
          <option value="">All bypass types</option>
          {lookups?.impairmentTypes?.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.status ?? '')} onChange={(e) => update('status', e.target.value)}>
          <option value="">All statuses</option>
          {lookups?.statuses?.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.riskLevel ?? '')} onChange={(e) => update('riskLevel', e.target.value)}>
          <option value="">All risk levels</option>
          {lookups?.riskLevels?.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.savedView ?? '')} onChange={(e) => update('savedView', e.target.value)}>
          <option value="">Saved views</option>
          {savedViews?.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--psm-muted)]">
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={filters.startupBlocked === 'true'} onChange={(e) => update('startupBlocked', e.target.checked ? 'true' : '')} /> Startup blocked</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={filters.missingMitigation === 'true'} onChange={(e) => update('missingMitigation', e.target.checked ? 'true' : '')} /> Missing mitigation</label>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={filters.mocRequired === 'true'} onChange={(e) => update('mocRequired', e.target.checked ? 'true' : '')} /> MOC required / suggested</label>
      </div>
    </section>
  );
}
