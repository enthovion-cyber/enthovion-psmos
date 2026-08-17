'use client';

import { ReviewButton } from './ReviewApprovalPrimitives';

export function ApprovalFilters({ filters, lookups, savedViews, onChange }: { filters: Record<string, unknown>; lookups?: { approvalStatuses?: string[] | undefined; approvalStages?: string[] | undefined; approvalSourceModules?: string[] | undefined } | undefined; savedViews?: string[] | undefined; onChange: (filters: Record<string, unknown>) => void }) {
  const update = (key: string, value: string) => onChange({ ...filters, page: 1, [key]: value || undefined });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="text-sm font-semibold xl:col-span-2">Search
          <input className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.search ?? '')} onChange={(event) => update('search', event.target.value)} placeholder="Approval, equipment tag, record number, requester" />
        </label>
        <label className="text-sm font-semibold">Status
          <select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.status ?? '')} onChange={(event) => update('status', event.target.value)}>
            <option value="">All statuses</option>
            {lookups?.approvalStatuses?.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Source module
          <select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.sourceModule ?? '')} onChange={(event) => update('sourceModule', event.target.value)}>
            <option value="">All modules</option>
            {lookups?.approvalSourceModules?.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Stage
          <select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.stage ?? '')} onChange={(event) => update('stage', event.target.value)}>
            <option value="">All stages</option>
            {lookups?.approvalStages?.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Saved view
          <select className="mt-1 w-full rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.savedView ?? '')} onChange={(event) => update('savedView', event.target.value)}>
            <option value="">None</option>
            {savedViews?.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <ReviewButton onClick={() => onChange({ ...filters })} variant="primary">Apply Filters</ReviewButton>
        <ReviewButton onClick={() => onChange({ page: 1, limit: 25, sort: 'updated_at.desc' })}>Reset</ReviewButton>
        <ReviewButton onClick={() => onChange({ ...filters, overdue: 'true' })}>Overdue Only</ReviewButton>
        <ReviewButton onClick={() => onChange({ ...filters, safetyCritical: 'true' })}>Safety Critical</ReviewButton>
      </div>
    </section>
  );
}
