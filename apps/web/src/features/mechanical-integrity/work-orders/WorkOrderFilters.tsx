'use client';

import type { MiWorkOrderLookups } from '../types/work-order.types';

export function WorkOrderFilters({ filters, lookups, savedViews, onChange }: { filters: Record<string, unknown>; lookups?: MiWorkOrderLookups | undefined; savedViews?: string[] | undefined; onChange: (next: Record<string, unknown>) => void }) {
  const update = (key: string, value: string) => onChange({ ...filters, page: 1, [key]: value || undefined });
  const toggle = (key: string) => onChange({ ...filters, page: 1, [key]: filters[key] === 'true' ? undefined : 'true' });
  return (
    <section className="space-y-4 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search work order/title/equipment" value={String(filters.search ?? '')} onChange={(event) => update('search', event.target.value)} />
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.status ?? '')} onChange={(event) => update('status', event.target.value)}><option value="">All statuses</option>{(lookups?.workStatuses ?? []).map((status) => <option key={status} value={status}>{status}</option>)}</select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.priority ?? '')} onChange={(event) => update('priority', event.target.value)}><option value="">All priorities</option>{(lookups?.priorities ?? []).map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.riskLevel ?? '')} onChange={(event) => update('riskLevel', event.target.value)}><option value="">All risk levels</option>{(lookups?.riskLevels ?? []).map((risk) => <option key={risk} value={risk}>{risk}</option>)}</select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.workOrderType ?? '')} onChange={(event) => update('workOrderType', event.target.value)}><option value="">All types</option>{(lookups?.workOrderTypes ?? []).map((type) => <option key={type} value={type}>{type}</option>)}</select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.workCategory ?? '')} onChange={(event) => update('workCategory', event.target.value)}><option value="">All categories</option>{(lookups?.workCategories ?? []).map((category) => <option key={category} value={category}>{category}</option>)}</select>
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Owner user ID" value={String(filters.owner ?? '')} onChange={(event) => update('owner', event.target.value)} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Assigned user ID" value={String(filters.assignedUserId ?? '')} onChange={(event) => update('assignedUserId', event.target.value)} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Contractor/vendor" value={String(filters.contractorVendor ?? '')} onChange={(event) => update('contractorVendor', event.target.value)} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Source module" value={String(filters.sourceModule ?? '')} onChange={(event) => update('sourceModule', event.target.value)} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Source record ID" value={String(filters.sourceRecordId ?? '')} onChange={(event) => update('sourceRecordId', event.target.value)} />
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.savedView ?? '')} onChange={(event) => update('savedView', event.target.value)}><option value="">Saved views</option>{(savedViews ?? []).map((view) => <option key={view} value={view}>{view}</option>)}</select>
        <button type="button" onClick={() => onChange({ page: 1, limit: filters.limit ?? 25, sort: filters.sort ?? 'updated_at.desc' })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm font-semibold">Clear Filters</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {([
          ['ptwRequired', 'PTW required'],
          ['ptwLinked', 'PTW linked'],
          ['lotoRequired', 'LOTO required'],
          ['lotoLinked', 'LOTO linked'],
          ['shutdownRequired', 'Shutdown'],
          ['partsRequired', 'Parts required'],
          ['waitingParts', 'Waiting parts'],
          ['contractorWork', 'Contractor'],
          ['verificationRequired', 'Verification'],
          ['evidenceRequired', 'Evidence'],
          ['startupBlocker', 'Startup blocker'],
          ['mocRequired', 'MOC required'],
          ['psmCritical', 'PSM critical']
        ] as Array<[string, string]>).map(([key, label]) => (
          <button key={key} type="button" onClick={() => toggle(key)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${filters[key] === 'true' ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]'}`}>{label}</button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <input type="date" title="Due from" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.dueFrom ?? '')} onChange={(event) => update('dueFrom', event.target.value)} />
        <input type="date" title="Due to" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.dueTo ?? '')} onChange={(event) => update('dueTo', event.target.value)} />
        <input type="date" title="Created from" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.createdFrom ?? '')} onChange={(event) => update('createdFrom', event.target.value)} />
        <input type="date" title="Planned start from" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.plannedStartFrom ?? '')} onChange={(event) => update('plannedStartFrom', event.target.value)} />
      </div>
    </section>
  );
}
