'use client';

import { ActionButton, PrimaryButton } from '../safeguards/SafeguardUiPrimitives';
import type { MiReadinessLookups } from '../types/readiness.types';

export function ReadinessFilters({ filters, lookups, savedViews, onChange }: { filters: Record<string, unknown>; lookups?: MiReadinessLookups | undefined; savedViews?: string[] | undefined; onChange: (filters: Record<string, unknown>) => void }) {
  const update = (key: string, value: string) => onChange({ ...filters, page: 1, [key]: value || undefined });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="text-sm font-semibold xl:col-span-2">Search
          <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.search ?? '')} onChange={(event) => update('search', event.target.value)} placeholder="Equipment tag, name, assessor, blocker" />
        </label>
        <label className="text-sm font-semibold">Status
          <select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.status ?? '')} onChange={(event) => update('status', event.target.value)}>
            <option value="">All statuses</option>
            {lookups?.statuses?.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Decision
          <select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.decision ?? '')} onChange={(event) => update('decision', event.target.value)}>
            <option value="">All decisions</option>
            {lookups?.decisions?.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Source
          <select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.source ?? '')} onChange={(event) => update('source', event.target.value)}>
            <option value="">All sources</option>
            {['Equipment','Inspection','PM','Calibration','PSV','SIF/SIS','Interlock','Critical Alarm','Deficiency','Deviation','Work Order','PSSR','MOC','Missing Document'].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Saved View
          <select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.savedView ?? '')} onChange={(event) => update('savedView', event.target.value)}>
            <option value="">None</option>
            {savedViews?.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <PrimaryButton onClick={() => onChange({ ...filters })}>Apply Filters</PrimaryButton>
        <ActionButton onClick={() => onChange({ page: 1, limit: 25, sort: 'updated_at.desc' })}>Reset</ActionButton>
      </div>
    </section>
  );
}
