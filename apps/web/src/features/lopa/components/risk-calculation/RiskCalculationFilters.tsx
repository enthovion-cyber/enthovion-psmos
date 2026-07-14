import type { LopaRiskCalculationFilters } from '../../types/lopa-risk-calculation.types';

export function RiskCalculationFilters({ filters, setFilters }: { filters: LopaRiskCalculationFilters; setFilters: (filters: LopaRiskCalculationFilters) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-xl border border-cyan-300/10 bg-[#071525] p-3 md:grid-cols-[1fr_180px_180px_auto]">
      <input className="rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-100 outline-none" placeholder="Search gaps, blockers, versions..." value={filters.q ?? ''} onChange={(event) => setFilters({ ...filters, q: event.target.value })} />
      <select className="rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-100 outline-none" value={filters.status ?? ''} onChange={(event) => setFilters({ ...filters, status: event.target.value || undefined })}>
        <option value="">All statuses</option><option>Open</option><option>In Progress</option><option>Closed</option><option>Archived</option>
      </select>
      <select className="rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-sm text-slate-100 outline-none" value={filters.quick ?? ''} onChange={(event) => setFilters({ ...filters, quick: event.target.value || undefined })}>
        <option value="">All records</option><option value="blockers">Closure blockers</option>
      </select>
      <button className="lopa-button-secondary" onClick={() => setFilters({})}>Reset</button>
    </div>
  );
}
