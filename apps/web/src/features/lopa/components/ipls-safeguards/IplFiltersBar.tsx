import { Search } from 'lucide-react';
import type { LopaIplsSafeguardsContext, LopaIplsSafeguardsFilters } from '../../types/lopa-ipls-safeguards.types';
import { inputClass, selectClass } from '../libraries/LibraryShared';

export function IplFiltersBar({ filters, setFilters, context }: { filters: LopaIplsSafeguardsFilters; setFilters: (filters: LopaIplsSafeguardsFilters) => void; context?: LopaIplsSafeguardsContext }) {
  const update = (key: keyof LopaIplsSafeguardsFilters, value: string) => setFilters({ ...filters, [key]: value || undefined });
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-[#071525] p-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-500" size={15} />
          <input className={`${inputClass} pl-9`} value={filters.q ?? ''} onChange={(event) => update('q', event.target.value)} placeholder="Search safeguards, IPLs, source, notes..." />
        </label>
        <select className={selectClass} value={filters.safeguardType ?? ''} onChange={(event) => update('safeguardType', event.target.value)}>
          <option value="">All IPL types</option>
          {context?.safeguardTypes?.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select className={selectClass} value={filters.proposedUse ?? ''} onChange={(event) => update('proposedUse', event.target.value)}>
          <option value="">All safeguard uses</option>
          {context?.proposedUses?.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select className={selectClass} value={filters.validationStatus ?? ''} onChange={(event) => update('validationStatus', event.target.value)}>
          <option value="">All validation</option>
          {context?.validationStatuses?.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <button className="lopa-button-secondary" onClick={() => setFilters({})}>Reset</button>
      </div>
    </div>
  );
}
