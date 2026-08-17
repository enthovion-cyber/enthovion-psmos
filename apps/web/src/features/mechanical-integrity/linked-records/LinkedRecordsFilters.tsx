'use client';

export function LinkedRecordsFilters({ filters, savedViews, onChange }: { filters: Record<string, unknown>; savedViews?: string[] | undefined; onChange: (filters: Record<string, unknown>) => void }) {
  const update = (key: string, value: string) => onChange({ ...filters, [key]: value || undefined, page: 1 });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search source/target/equipment" value={String(filters.search ?? '')} onChange={(event) => update('search', event.target.value)} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Source module" value={String(filters.sourceModule ?? '')} onChange={(event) => update('sourceModule', event.target.value)} />
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Target module" value={String(filters.targetModule ?? '')} onChange={(event) => update('targetModule', event.target.value)} />
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.savedView ?? '')} onChange={(event) => update('savedView', event.target.value)}>
          <option value="">Saved views</option>
          {(savedViews ?? []).map((view) => <option key={view}>{view}</option>)}
        </select>
      </div>
    </section>
  );
}
