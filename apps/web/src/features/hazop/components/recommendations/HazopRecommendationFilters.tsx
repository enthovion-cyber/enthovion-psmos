'use client';

import { Download, Search } from 'lucide-react';
import type { HazopRecommendationFilters as FilterState } from '../../types/hazop-recommendation.types';

export function HazopRecommendationFilters({ filters, onChange, onExport, exporting }: { filters: FilterState; onChange: (filters: FilterState) => void; onExport?: (() => void) | undefined; exporting?: boolean }) {
  const set = (key: keyof FilterState, value: string) => onChange({ ...filters, [key]: value, page: 1 });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
      <div className="grid gap-3 xl:grid-cols-[1fr_190px_160px_170px_160px_150px_auto]">
        <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]" /><input className="input pl-9" value={filters.search ?? ''} onChange={(e) => set('search', e.target.value)} placeholder="Search recommendations, owner, scenario, action..." /></label>
        <select className="input" value={filters.sourceType ?? 'All'} onChange={(e) => set('sourceType', e.target.value)}><option>All</option><option>Scenario</option><option>High/Critical Risk</option><option>Safeguard Gap</option><option>IPL Validation Failure</option><option>LOPA Trigger</option><option>Team Decision</option><option>MOC Requirement</option><option>PSSR Blocker</option><option>Manual</option></select>
        <select className="input" value={filters.priority ?? 'All'} onChange={(e) => set('priority', e.target.value)}><option>All</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option><option>Safety Critical</option></select>
        <select className="input" value={filters.status ?? 'All'} onChange={(e) => set('status', e.target.value)}><option>All</option><option>Draft</option><option>Open</option><option>Assigned</option><option>In Progress</option><option>Pending Evidence</option><option>Pending Verification</option><option>Verified Closed</option><option>Rejected</option><option>Cancelled</option><option>Deferred</option><option>Accepted Risk / No Action</option></select>
        <select className="input" value={filters.actionLinked ?? 'All'} onChange={(e) => set('actionLinked', e.target.value)}><option>All</option><option value="Yes">Action linked</option><option value="No">No action</option></select>
        <select className="input" value={filters.closureBlocker ?? 'All'} onChange={(e) => set('closureBlocker', e.target.value)}><option>All</option><option value="Yes">Blockers</option><option value="No">Non-blockers</option></select>
        <div className="flex gap-2"><button onClick={() => onChange({ page: 1, limit: filters.limit ?? 25 })} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold">Reset</button>{onExport ? <button onClick={onExport} disabled={exporting} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold disabled:opacity-50"><Download size={15} className="mr-2 inline" />Export</button> : null}</div>
      </div>
    </section>
  );
}
