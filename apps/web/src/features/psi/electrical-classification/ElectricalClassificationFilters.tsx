'use client';

import { PsiCard } from '../shared/PsiUi';

type Props = { filters: Record<string, unknown>; onChange: (filters: Record<string, unknown>) => void; savedViews?: string[] };

export function ElectricalClassificationFilters({ filters, onChange, savedViews = [] }: Props) {
  const set = (key: string, value: string) => onChange({ ...filters, page: 1, [key]: value || undefined });
  return (
    <PsiCard title="Filters / Search" subtitle="Server-side filters cover site, unit, area, equipment, classification system, zone/division, groups, status, review, MOC, PSSR, and missing-data views.">
      <div className="grid gap-3 md:grid-cols-4">
        <input className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" placeholder="Search title, material, tag, drawing..." value={String(filters.search ?? '')} onChange={(event) => set('search', event.target.value)} />
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.classificationSystem ?? '')} onChange={(event) => set('classificationSystem', event.target.value)}>
          <option value="">All systems</option><option>IEC Zone</option><option>NEC Class/Division</option><option>Hybrid / Cross Reference</option>
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.status ?? '')} onChange={(event) => set('status', event.target.value)}>
          <option value="">All statuses</option><option>Draft</option><option>Pending Review</option><option>Approved</option><option>Needs Revalidation</option><option>Archived</option>
        </select>
        <select className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" value={String(filters.preset ?? '')} onChange={(event) => set('preset', event.target.value)}>
          <option value="">All dashboard views</option><option value="hazardous-areas">Hazardous areas</option><option value="equipment-ratings">Equipment ratings</option><option value="rating-mismatches">Rating mismatches</option><option value="missing">Missing classification</option><option value="review-overdue">Review overdue</option><option value="moc-required">MOC required</option><option value="pssr-blockers">PSSR blockers</option>
        </select>
      </div>
      {savedViews.length ? <p className="mt-3 text-xs text-[var(--psm-muted)]">Saved views: {savedViews.join(', ')}</p> : null}
    </PsiCard>
  );
}
