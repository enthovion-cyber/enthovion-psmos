'use client';

import type { ChangeEvent } from 'react';
import { PsiCard } from '../shared/PsiUi';

export function ProcessChemistryFilters({ filters, onChange, savedViews }: { filters: Record<string, unknown>; onChange: (filters: Record<string, unknown>) => void; savedViews: string[] }) {
  const update = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...filters, page: 1, [event.target.name]: event.target.value });
  return (
    <PsiCard title="Filters / Search" subtitle="Server-side search, filtering, saved views, and PDF-required hazard views.">
      <div className="grid gap-3 md:grid-cols-5">
        <input name="search" value={String(filters.search ?? '')} onChange={update} placeholder="Search chemistry, equation, summary" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm" />
        <select name="chemistryType" value={String(filters.chemistryType ?? '')} onChange={update} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">
          <option value="">All chemistry types</option>
          <option>Reaction</option><option>Mixing / blending</option><option>Polymerization</option><option>Oxidation</option><option>Decomposition concern</option><option>Storage stability</option>
        </select>
        <select name="runawayPotential" value={String(filters.runawayPotential ?? '')} onChange={update} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">
          <option value="">All runaway levels</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option><option>Unknown / Needs Study</option>
        </select>
        <select name="missingData" value={String(filters.missingData ?? '')} onChange={update} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">
          <option value="">Completeness</option><option value="true">Missing data</option>
        </select>
        <select name="savedView" value={String(filters.savedView ?? '')} onChange={update} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2 text-sm">
          <option value="">Saved views</option>
          {savedViews.map((view) => <option key={view}>{view}</option>)}
        </select>
      </div>
    </PsiCard>
  );
}
