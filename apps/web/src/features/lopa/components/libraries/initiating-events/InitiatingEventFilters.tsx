'use client';

import { Search } from 'lucide-react';
import type { LibraryFilters } from '../../../types/lopa-library.types';
import { inputClass, selectClass } from '../LibraryShared';

export function InitiatingEventFilters({ filters, onChange }: { filters: LibraryFilters; onChange: (filters: LibraryFilters) => void }) {
  const set = (key: string, value: string) => onChange({ ...filters, page: 1, [key]: value || undefined });
  return (
    <section className="grid grid-cols-1 gap-3 rounded-xl border border-cyan-300/10 bg-[#071525] p-4 md:grid-cols-[1fr_180px_180px_180px]">
      <label className="relative">
        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
        <input className={`${inputClass} pl-9`} placeholder="Search event code, name, failure mode, source..." value={String(filters.search ?? '')} onChange={(event) => set('search', event.target.value)} />
      </label>
      <select className={selectClass} value={String(filters.category ?? '')} onChange={(event) => set('category', event.target.value)}>
        <option value="">All categories</option>
        {['Control valve failure', 'Pump failure', 'Compressor failure', 'Operator error', 'Utility failure', 'External event', 'Instrument failure', 'Equipment/line failure', 'Heat exchanger failure', 'Relief system demand', 'Process upset', 'Human error', 'Other'].map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className={selectClass} value={String(filters.status ?? '')} onChange={(event) => set('status', event.target.value)}>
        <option value="">All statuses</option>
        {['Draft', 'Pending Review', 'Approved', 'Rejected', 'Superseded', 'Archived'].map((item) => <option key={item}>{item}</option>)}
      </select>
      <select className={selectClass} value={String(filters.scope ?? '')} onChange={(event) => set('scope', event.target.value)}>
        <option value="">All scopes</option>
        <option>Corporate</option>
        <option>Site</option>
      </select>
    </section>
  );
}
