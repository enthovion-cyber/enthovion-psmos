'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import type { IplRegistryContext, IplRegistryFilters } from '../../types/lopa-ipl-registry.types';
import { inputClass, selectClass } from '../libraries/LibraryShared';

export function IplRegistryFilters({ filters, context, onChange }: { filters: IplRegistryFilters; context?: IplRegistryContext | undefined; onChange: (filters: IplRegistryFilters) => void }) {
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#071525] p-3">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]">
        <label className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input className={`${inputClass} pl-9`} placeholder="Search IPL name, type, source, protected equipment..." value={filters.q ?? ''} onChange={(event) => onChange({ ...filters, q: event.target.value, page: 1 })} />
        </label>
        <select className={selectClass} value={filters.status ?? ''} onChange={(event) => onChange({ ...filters, status: event.target.value, page: 1 })}>
          <option value="">All statuses</option>
          {(context?.approvalStatuses ?? []).map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select className={selectClass} value={filters.iplType ?? ''} onChange={(event) => onChange({ ...filters, iplType: event.target.value, page: 1 })}>
          <option value="">All IPL types</option>
          {(context?.iplTypes ?? []).map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select className={selectClass} value={filters.validationStatus ?? ''} onChange={(event) => onChange({ ...filters, validationStatus: event.target.value, page: 1 })}>
          <option value="">Validation status</option>
          {(context?.validationStatuses ?? []).map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select className={selectClass} value={filters.siteId ?? ''} onChange={(event) => onChange({ ...filters, siteId: event.target.value, page: 1 })}>
          <option value="">All sites</option>
          {(context?.sites ?? []).map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
        </select>
        <button onClick={() => onChange({ page: 1, limit: filters.limit ?? 25 })} className="lopa-button-secondary justify-center"><SlidersHorizontal size={14} /> Reset</button>
      </div>
    </section>
  );
}
