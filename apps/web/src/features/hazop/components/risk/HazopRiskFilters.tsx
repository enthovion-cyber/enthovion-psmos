import { Download, Search } from 'lucide-react';
import { HazopRiskSelect } from './HazopRiskBadge';

const riskLevels = ['All', 'Low', 'Medium', 'High', 'Critical'];
const statuses = ['All', 'Draft', 'Open', 'Recommendation Required', 'LOPA Required', 'Closed'];

export function HazopRiskFilters({ filters, onChange, canExport, onExport, exporting }: { filters: any; onChange: (filters: any) => void; canExport: boolean; onExport: () => void; exporting: boolean }) {
  const set = (key: string, value: string) => onChange({ ...filters, [key]: value });
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_160px_180px_160px_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-3 text-[var(--psm-muted)]" size={16} />
          <input value={filters.search} onChange={(event) => set('search', event.target.value)} className="input pl-9" placeholder="Search scenario, node, cause, consequence, safeguard..." />
        </label>
        <HazopRiskSelect value={filters.riskLevel} values={riskLevels} onChange={(value) => set('riskLevel', value)} />
        <HazopRiskSelect value={filters.status} values={statuses} onChange={(value) => set('status', value)} />
        <HazopRiskSelect value={filters.lopaRequired === 'true' ? 'Yes' : filters.lopaRequired === 'false' ? 'No' : 'All'} values={['All', 'Yes', 'No']} onChange={(value) => set('lopaRequired', value === 'Yes' ? 'true' : value === 'No' ? 'false' : 'All')} />
        <button disabled={!canExport || exporting} onClick={onExport} className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-sm font-semibold hover:bg-[var(--psm-surface-2)] disabled:cursor-not-allowed disabled:opacity-50"><Download size={15} className="mr-2 inline" />{exporting ? 'Exporting' : 'Export'}</button>
      </div>
    </section>
  );
}
