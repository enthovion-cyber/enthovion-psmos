import { PsiButton, PsiCard } from '../shared/PsiUi';

const ratingOptions = ['', 'Compatible', 'Compatible With Conditions', 'Limited Compatibility', 'Not Recommended', 'Incompatible', 'Unknown / Needs Data', 'Needs Engineering Review', 'Temporary Use Only', 'Approved Exception'];

export function MaterialCompatibilityFilters({ filters, onChange, savedViews }: { filters: Record<string, unknown>; onChange: (filters: Record<string, unknown>) => void; savedViews?: Array<Record<string, any>> }) {
  const update = (patch: Record<string, unknown>) => onChange({ ...filters, ...patch, page: 1 });
  return (
    <PsiCard title="Filters / Search" subtitle="Server-side search by chemical, CAS, material family/grade, equipment, service, rating, conflicts, MOC, PSSR, MI impact, missing data, and review due state.">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <input value={String(filters.search ?? '')} onChange={(event) => update({ search: event.target.value })} placeholder="Search chemical, material, CAS, equipment" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <select value={String(filters.rating ?? '')} onChange={(event) => update({ rating: event.target.value || undefined })} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">{ratingOptions.map((option) => <option key={option || 'all'} value={option}>{option || 'All ratings'}</option>)}</select>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(filters.conflicts)} onChange={(event) => update({ conflicts: event.target.checked || undefined })} /> Conflicts</label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(filters.missing)} onChange={(event) => update({ missing: event.target.checked || undefined })} /> Missing data</label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(filters.mocRequired)} onChange={(event) => update({ mocRequired: event.target.checked || undefined })} /> MOC required</label>
        <label className="flex items-center gap-2 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><input type="checkbox" checked={Boolean(filters.pssrBlockers)} onChange={(event) => update({ pssrBlockers: event.target.checked || undefined })} /> PSSR blockers</label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--psm-muted)]"><span>Saved views: {savedViews?.length ?? 0}</span><PsiButton variant="secondary" onClick={() => onChange({ page: 1, limit: filters.limit ?? 25 })}>Reset</PsiButton></div>
    </PsiCard>
  );
}

