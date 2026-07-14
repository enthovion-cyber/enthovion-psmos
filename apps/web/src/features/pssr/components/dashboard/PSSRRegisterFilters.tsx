'use client';

import { Filter, Search, X, Calendar, RotateCcw, ChevronDown } from 'lucide-react';

const baseInputClass = "h-10 w-full appearance-none rounded-md border border-slate-800 bg-slate-950/60 px-3 pr-8 text-xs text-slate-200 outline-none transition-all focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/40 placeholder:text-slate-500";

const statuses = ['Draft', 'Created', 'In Preparation', 'In Review', 'Field Verification', 'Punch List Open', 'Ready For Authorization', 'Authorized For Startup', 'Startup Released', 'Closed', 'Cancelled'];
const pssrTypes = ['MOC Startup Review', 'New Equipment Startup', 'New Process Unit Startup', 'Restart After Shutdown', 'Safety System Startup', 'Commissioning Startup'];
const startupTypes = ['Initial startup', 'Restart', 'Startup after MOC', 'Startup after shutdown', 'Startup after maintenance', 'Commissioning'];
const readinessStatuses = ['Not Ready', 'In Progress', 'Blocked', 'Ready Pending Signatures', 'Authorized', 'Released', 'Closed'];

export function PSSRRegisterFilters({ 
  filters, 
  quickTabs, 
  onFilter, 
  onReset 
}: { 
  filters: Record<string, any>; 
  quickTabs: any[]; 
  onFilter: (key: string, value?: string | number) => void; 
  onReset: () => void;
}) {
  return (
    <section className="w-full space-y-4 rounded-xl border border-slate-800/80 bg-[#040d1a]/95 p-4 shadow-2xl backdrop-blur-md">
      
      {/* Quick Tabs Row */}
      {quickTabs && quickTabs.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-2">
          {quickTabs.map((tab) => (
            <button 
              key={tab.key} 
              onClick={() => Object.entries(tab.filter ?? {}).forEach(([key, value]) => onFilter(key, value as string))} 
              className="group flex items-center rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-xs font-medium text-slate-400 transition-all hover:border-sky-500/30 hover:bg-sky-950/20 hover:text-sky-300 focus:outline-none"
            >
              {tab.label} 
              <span className="ml-2 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-400 transition-colors group-hover:bg-sky-500/20">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Primary Layout Filter Row - Inline Stack Inspired by Mockup */}
      <div className="flex flex-wrap items-end gap-3">
        
        {/* Real Data Search Input */}
        <div className="relative flex h-10 min-w-[240px] flex-1 items-center">
          <Search size={14} className="pointer-events-none absolute left-3 text-slate-500" />
          <input 
            value={filters.search ?? ''} 
            onChange={(event) => onFilter('search', event.target.value)} 
            placeholder="Search PSSR, title, equipment tag..." 
            className={`${baseInputClass} pl-9 pr-3`} 
          />
        </div>

        {/* Real Select Dropdowns with Stacked Label Hierarchy */}
        <Select label="Status" value={filters.status} options={statuses} placeholder="All" onChange={(value) => onFilter('status', value)} />
        <Select label="PSSR Type" value={filters.pssr_type} options={pssrTypes} placeholder="All" onChange={(value) => onFilter('pssr_type', value)} />
        <Select label="Startup Type" value={filters.startup_type} options={startupTypes} placeholder="All" onChange={(value) => onFilter('startup_type', value)} />
        <Select label="Readiness Status" value={filters.readiness_status} options={readinessStatuses} placeholder="All" onChange={(value) => onFilter('readiness_status', value)} />

        {/* Custom Target Date Range Group */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/30 px-2 py-0.5 h-10">
          <div className="flex flex-col justify-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-1">From</span>
            <input 
              type="date" 
              value={filters.target_startup_from ?? ''} 
              onChange={(event) => onFilter('target_startup_from', event.target.value)} 
              className="bg-transparent text-xs text-slate-300 outline-none w-[110px]" 
              style={{ colorScheme: 'dark' }} 
            />
          </div>
          <div className="h-6 w-[1px] bg-slate-800 self-center" />
          <div className="flex flex-col justify-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 px-1">To</span>
            <input 
              type="date" 
              value={filters.target_startup_to ?? ''} 
              onChange={(event) => onFilter('target_startup_to', event.target.value)} 
              className="bg-transparent text-xs text-slate-300 outline-none w-[110px]" 
              style={{ colorScheme: 'dark' }} 
            />
          </div>
          <Calendar size={14} className="text-slate-500 ml-1 shrink-0" />
        </div>

        {/* Action Controls */}
        <button 
          onClick={onReset} 
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-800 bg-slate-950/40 px-3.5 text-xs font-semibold text-slate-400 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 focus:outline-none"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      </div>

      {/* Secondary Row: Toggles Matrix */}
      <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4 md:flex md:flex-wrap md:items-center">
        <Toggle label="Startup Blockers" active={filters.has_startup_blockers === 'true'} onClick={() => onFilter('has_startup_blockers', filters.has_startup_blockers === 'true' ? undefined : 'true')} />
        <Toggle label="Category A Open" active={filters.category_a_open === 'true'} onClick={() => onFilter('category_a_open', filters.category_a_open === 'true' ? undefined : 'true')} />
        <Toggle label="Missing Docs" active={filters.missing_documents === 'true'} onClick={() => onFilter('missing_documents', filters.missing_documents === 'true' ? undefined : 'true')} />
        <Toggle label="Failed Tests" active={filters.failed_tests === 'true'} onClick={() => onFilter('failed_tests', filters.failed_tests === 'true' ? undefined : 'true')} />
      </div>

    </section>
  );
}

// --- Sub-components (Rebuilt for high-end UI matching layout) ---

function Select({ 
  label, 
  value, 
  options, 
  placeholder, 
  onChange 
}: { 
  label: string; 
  value?: string; 
  options: string[]; 
  placeholder: string; 
  onChange: (value?: string) => void; 
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[140px] flex-1 sm:flex-initial">
      <span className="pl-1 text-[10px] font-semibold text-slate-400 tracking-wide">{label}</span>
      <div className="relative">
        <select 
          value={value ?? ''} 
          onChange={(event) => onChange(event.target.value || undefined)} 
          className={baseInputClass}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option} className="bg-[#0b131f] text-slate-200">{option}</option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-3 text-slate-500" />
      </div>
    </div>
  );
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium tracking-wide transition-all focus:outline-none md:w-auto ${
        active 
          ? 'border-sky-500/30 bg-sky-500/10 text-sky-400' 
          : 'border-slate-800/80 bg-slate-950/20 text-slate-400 hover:border-slate-700 hover:text-slate-300'
      }`}
    >
      <Filter size={12} className={active ? "text-sky-400" : "opacity-60"} />
      <span className="truncate">{label}</span>
      {active && <X size={12} className="ml-1 opacity-70 hover:opacity-100" />}
    </button>
  );
}