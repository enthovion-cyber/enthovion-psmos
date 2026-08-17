import { PsiButton, PsiCard } from '../shared/PsiUi';

export function PsiUnitFilters({ filters, lookups, savedViews = [], onChange }: { filters: Record<string, unknown>; lookups?: Record<string, string[]> | undefined; savedViews?: string[] | undefined; onChange: (filters: Record<string, unknown>) => void }) {
  const update = (key: string, value: unknown) => onChange({ ...filters, page: 1, [key]: value || undefined });
  return (
    <PsiCard title="Filters / Saved Views" subtitle="Server-side search, filtering, sorting, and saved-view foundation.">
      <div className="grid gap-3 md:grid-cols-4">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search unit name/code" value={String(filters.search ?? '')} onChange={(event) => update('search', event.target.value)} />
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.unitType ?? '')} onChange={(event) => update('unitType', event.target.value)}>
          <option value="">All unit types</option>
          {(lookups?.unitTypes ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.psiStatus ?? '')} onChange={(event) => update('psiStatus', event.target.value)}>
          <option value="">All PSI statuses</option>
          {(lookups?.psiStatuses ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.completenessStatus ?? '')} onChange={(event) => update('completenessStatus', event.target.value)}>
          <option value="">All completeness</option>
          <option value="Complete">Complete</option>
          <option value="Mostly Complete">Mostly Complete</option>
          <option value="Incomplete">Incomplete</option>
          <option value="Critical Gaps">Critical Gaps</option>
          <option value="Not Reviewed">Not Reviewed</option>
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {savedViews.map((view) => <button key={view} type="button" onClick={() => onChange({ page: 1, limit: filters.limit ?? 25, savedView: view })} className="rounded-full border border-[var(--psm-line)] px-3 py-1 text-xs font-semibold text-[var(--psm-muted)] hover:bg-[var(--psm-surface-2)]">{view}</button>)}
        <PsiButton variant="secondary" onClick={() => onChange({ page: 1, limit: 25, sort: 'updated_at.desc' })}>Clear</PsiButton>
      </div>
    </PsiCard>
  );
}
