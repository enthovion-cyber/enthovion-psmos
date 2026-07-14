import { Filter } from 'lucide-react';
import type { PTWRegisterFilters } from '../../services/ptw-dashboard.service';

const statuses = ['', 'Active', 'Submitted', 'Issued', 'Suspended', 'Closed', 'Cancelled'];
const permitTypes = ['', 'HOT_WORK', 'COLD_WORK', 'CONFINED_SPACE', 'ELECTRICAL_ISOLATION', 'EXCAVATION', 'RADIOGRAPHY', 'WORKING_AT_HEIGHT', 'LINE_BREAKING', 'SIMOPS'];
const risks = ['', 'Low', 'Medium', 'High', 'Critical'];

export function PermitRegisterFilters({ filters, onChange, onReset }: { filters: PTWRegisterFilters; onChange: (filters: Partial<PTWRegisterFilters>) => void; onReset: () => void }) {
  return (
    <section className="rounded-lg border border-cyan-300/10 bg-[#0b1d31]/88 p-2 shadow-2xl shadow-black/20">
      <div className="grid gap-2 md:grid-cols-[1.2fr_150px_190px_130px_auto]">
        <input className="ptw-input" placeholder="Search permit number, title, equipment, holder, area..." value={filters.search ?? ''} onChange={(event) => onChange({ search: event.target.value })} />
        <select className="ptw-input" value={filters.status ?? ''} onChange={(event) => onChange({ status: event.target.value })}>
          {statuses.map((status) => <option key={status || 'all'} value={status}>{status || 'All statuses'}</option>)}
        </select>
        <select className="ptw-input" value={filters.permitType ?? ''} onChange={(event) => onChange({ permitType: event.target.value })}>
          {permitTypes.map((type) => <option key={type || 'all'} value={type}>{type ? type.replaceAll('_', ' ') : 'All permit types'}</option>)}
        </select>
        <select className="ptw-input" value={filters.riskLevel ?? ''} onChange={(event) => onChange({ riskLevel: event.target.value })}>
          {risks.map((risk) => <option key={risk || 'all'} value={risk}>{risk || 'All risks'}</option>)}
        </select>
        <button className="ptw-toolbar-button justify-center" onClick={onReset}><Filter size={15} /> Reset</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {[
          ['Active', { status: 'Active' }],
          ['Pending', { status: 'Submitted' }],
          ['Expiring', { expiringWithin: '2', status: '' }],
          ['Suspended', { status: 'Suspended' }],
          ['Closed', { status: 'Closed' }],
          ['History', { sort: 'created_at:desc' }]
        ].map(([label, patch]) => (
          <button key={label as string} className="rounded-full border border-cyan-300/10 px-3 py-1 text-slate-300 hover:border-blue-400/40 hover:text-white" onClick={() => onChange(patch as Partial<PTWRegisterFilters>)}>{label as string}</button>
        ))}
      </div>
    </section>
  );
}
