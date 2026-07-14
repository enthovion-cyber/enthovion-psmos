'use client';

import { Download, Filter, Search } from 'lucide-react';
import type { HazopSafeguardFilters } from '../../types/hazop-safeguard.types';

const types = ['All', 'BPCS', 'Alarm with operator response', 'PSV / relief valve', 'Rupture disc', 'Mechanical protection', 'Interlock', 'SIS / SIF', 'ESD', 'Fire and gas system', 'Physical containment', 'Check valve', 'Flame arrestor', 'Ventilation', 'Operating procedure', 'Maintenance/inspection program', 'Training/competency', 'Emergency response', 'Administrative control', 'PTW control', 'LOTO / isolation control', 'Other'];

export function HazopSafeguardFilters({ filters, onChange, onExport, exporting }: { filters: HazopSafeguardFilters; onChange: (filters: HazopSafeguardFilters) => void; onExport?: (() => void) | undefined; exporting?: boolean }) {
  const set = (key: keyof HazopSafeguardFilters, value: string) => onChange({ ...filters, [key]: value, page: 1 });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
      <div className="grid gap-3 xl:grid-cols-[1fr_210px_190px_190px_160px_auto]">
        <label className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--psm-muted)]" />
          <input className="input pl-9" value={filters.search ?? ''} onChange={(event) => set('search', event.target.value)} placeholder="Search safeguard, scenario, equipment, document..." />
        </label>
        <select className="input" value={filters.safeguardType ?? 'All'} onChange={(event) => set('safeguardType', event.target.value)}>{types.map((type) => <option key={type}>{type}</option>)}</select>
        <select className="input" value={filters.iplCandidate ?? 'All'} onChange={(event) => set('iplCandidate', event.target.value)}><option>All</option><option>Yes</option><option>No</option></select>
        <select className="input" value={filters.validationStatus ?? 'All'} onChange={(event) => set('validationStatus', event.target.value)}><option>All</option><option>Passed</option><option>Failed</option><option>Needs evidence</option><option>Not validated</option></select>
        <select className="input" value={filters.gapStatus ?? 'All'} onChange={(event) => set('gapStatus', event.target.value)}><option>All</option><option>Open</option><option>Closed</option></select>
        <div className="flex gap-2">
          <button onClick={() => onChange({ search: '', page: 1, limit: filters.limit ?? 25 })} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold"><Filter size={15} className="mr-2 inline" />Reset</button>
          {onExport ? <button onClick={onExport} disabled={exporting} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold disabled:opacity-50"><Download size={15} className="mr-2 inline" />Export</button> : null}
        </div>
      </div>
    </section>
  );
}
