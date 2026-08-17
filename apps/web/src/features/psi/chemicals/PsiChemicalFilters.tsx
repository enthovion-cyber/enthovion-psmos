'use client';

import type { ChangeEvent } from 'react';
import { PsiCard } from '../shared/PsiUi';

export function PsiChemicalFilters({ filters, onChange, savedViews = [] }: { filters: Record<string, unknown>; onChange: (next: Record<string, unknown>) => void; savedViews?: string[] }) {
  const patch = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...filters, [event.target.name]: event.target.value || undefined, page: 1 });
  return (
    <PsiCard title="Filters / Search" subtitle="Server-side search, sorting, saved views, and hazard filters.">
      <div className="grid gap-3 md:grid-cols-4">
        <input name="search" value={String(filters.search ?? '')} onChange={patch} placeholder="Search name, CAS, formula" className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2" />
        <select name="sdsStatus" value={String(filters.sdsStatus ?? '')} onChange={patch} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><option value="">SDS status</option><option>Current</option><option>Missing</option><option>Expired</option><option>Pending Approval</option><option>Waived With Approval</option></select>
        <select name="highHazard" value={String(filters.highHazard ?? '')} onChange={patch} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><option value="">High hazard</option><option value="true">High hazard only</option></select>
        <select name="compatibilityRisk" value={String(filters.compatibilityRisk ?? '')} onChange={patch} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-2"><option value="">Compatibility risk</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">{savedViews.map((view) => <button key={view} type="button" onClick={() => onChange({ ...filters, view, page: 1 })} className="rounded-full border border-[var(--psm-line)] px-3 py-1 text-xs font-semibold text-[var(--psm-muted)] hover:text-[var(--psm-fg)]">{view}</button>)}</div>
    </PsiCard>
  );
}
