import type { LopaLinkedRecordFilters } from '../../types/lopa-linked-record.types';

export function LinkedRecordFilters({ filters, setFilters }: { filters: LopaLinkedRecordFilters; setFilters: (filters: LopaLinkedRecordFilters) => void }) {
  const cls = 'rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-100';
  return (
    <div className="grid grid-cols-1 gap-2 rounded-xl border border-cyan-300/10 bg-[#071525] p-3 md:grid-cols-[1fr_160px_160px_160px_auto]">
      <input className={cls} placeholder="Search linked records..." value={filters.q ?? ''} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
      <select className={cls} value={filters.sourceModule ?? ''} onChange={(e) => setFilters({ ...filters, sourceModule: e.target.value || undefined })}><option value="">All modules</option><option>HAZOP</option><option>MOC</option><option>PSSR</option><option>Equipment</option><option>Document</option><option>Action</option></select>
      <select className={cls} value={String(filters.required ?? '')} onChange={(e) => setFilters({ ...filters, required: e.target.value || undefined })}><option value="">All required</option><option value="true">Required</option><option value="false">Optional</option></select>
      <select className={cls} value={String(filters.sourceChanged ?? '')} onChange={(e) => setFilters({ ...filters, sourceChanged: e.target.value || undefined })}><option value="">All changes</option><option value="true">Source changed</option><option value="false">Current</option></select>
      <button className="lopa-button-secondary" onClick={() => setFilters({})}>Reset</button>
    </div>
  );
}
