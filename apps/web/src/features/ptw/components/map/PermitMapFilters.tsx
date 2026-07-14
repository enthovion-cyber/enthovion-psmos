'use client';

import { Filter, RotateCcw, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PTWMapFilters } from '../../services/ptw-map.service';

export function PermitMapFilters({ filters, onChange, onReset }: { filters: PTWMapFilters; onChange: (filters: Partial<PTWMapFilters>) => void; onReset: () => void }) {
  return (
    <section className="rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-3 shadow-xl shadow-black/15">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white"><Filter size={15} /> Map Filters</h2>
        <button type="button" onClick={onReset} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10"><RotateCcw size={13} /> Reset</button>
      </div>
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        <Input icon={<Search size={14} />} placeholder="Equipment tag or id" value={filters.equipment_id ?? ''} onChange={(value) => onChange({ equipment_id: value })} />
        <Select label="Status" value={filters.status ?? ''} onChange={(value) => onChange({ status: value })} options={['', 'Active', 'Pending Approval', 'Suspended', 'Closed', 'Expired']} />
        <Select label="Permit type" value={filters.permit_type ?? ''} onChange={(value) => onChange({ permit_type: value })} options={['', 'Hot Work', 'Cold Work', 'Confined Space', 'Electrical Isolation', 'Excavation', 'Line Breaking', 'Radiography', 'Working at Height', 'Simultaneous']} />
        <Select label="Risk" value={filters.risk_level ?? ''} onChange={(value) => onChange({ risk_level: value })} options={['', 'Low', 'Medium', 'High', 'Critical']} />
        <Select label="Conflict" value={filters.has_conflict ?? ''} onChange={(value) => onChange({ has_conflict: value })} options={['', 'true', 'false']} />
        <Select label="Gas" value={filters.gas_status ?? ''} onChange={(value) => onChange({ gas_status: value })} options={['', 'PASS', 'DUE', 'FAIL', 'MISSING']} />
        <Select label="Isolation" value={filters.isolation_status ?? ''} onChange={(value) => onChange({ isolation_status: value })} options={['', 'CONFIRMED', 'PENDING', 'NOT_REQUIRED']} />
        <Select label="Handover" value={filters.handover_status ?? ''} onChange={(value) => onChange({ handover_status: value })} options={['', 'COMPLETE', 'PENDING', 'NOT_REQUIRED']} />
        <Select label="Expiring" value={filters.expiring_within ?? ''} onChange={(value) => onChange({ expiring_within: value })} options={['', '30', '60', '120', '240']} />
        <Input placeholder="Unit id" value={filters.unit_id ?? ''} onChange={(value) => onChange({ unit_id: value })} />
        <Input placeholder="Area id" value={filters.area_id ?? ''} onChange={(value) => onChange({ area_id: value })} />
        <Input placeholder="Holder or contractor id" value={filters.holder_id ?? ''} onChange={(value) => onChange({ holder_id: value })} />
      </div>
    </section>
  );
}

function Input({ value, onChange, placeholder, icon }: { value: string; onChange: (value: string) => void; placeholder: string; icon?: ReactNode }) {
  return (
    <label className="relative">
      {icon ? <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span> : null}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`h-10 w-full rounded-md border border-cyan-300/15 bg-slate-950/45 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-300 ${icon ? 'pl-9' : ''}`} />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="sr-only">
      {label}
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="not-sr-only h-10 w-full rounded-md border border-cyan-300/15 bg-slate-950/45 px-3 text-sm text-white outline-none focus:border-blue-300">
        {options.map((option) => <option key={option || 'all'} value={option}>{option || `All ${label.toLowerCase()}`}</option>)}
      </select>
    </label>
  );
}
