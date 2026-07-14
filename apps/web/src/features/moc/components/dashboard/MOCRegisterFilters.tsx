'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';

const statuses = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Implementation', 'Pending PSSR', 'Ready For Startup', 'Closed', 'Rejected', 'Cancelled'];
const risks = ['Low', 'Medium', 'High', 'Critical'];
const types = ['Permanent Process Change', 'Temporary Change', 'Emergency Change', 'Equipment Change', 'Procedure Change'];

export function MOCRegisterFilters() {
  const { filters, setFilter, setFilters, resetFilters } = useMOCDashboardStore();

  // Evaluates whether a quick-filter configuration is actively running in the state manager
  const isQuickFilterActive = (checkObject: Record<string, any>) => {
    return Object.entries(checkObject).every(([key, value]) => filters[key] === value);
  };

  return (
    <section className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-xl md:p-5">
      
      {/* Upper Control Bar Block */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-3">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
          <SlidersHorizontal size={14} className="text-sky-400" /> Filter & Search Workspace
        </h2>
        <button 
          onClick={resetFilters} 
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900 transition-all focus:outline-none"
        >
          <X size={13} /> Reset Filters
        </button>
      </div>

      {/* Main Structural Query Layout (1 Column on small screens -> 2 Columns -> 5 Columns on large viewports) */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1.2fr_0.8fr]">
        
        {/* Full-text search element */}
        <label className="relative block sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-3.5 text-slate-500 pointer-events-none" size={14} />
          <input 
            value={filters.search ?? ''} 
            onChange={(event) => setFilter('search', event.target.value || undefined)} 
            className="h-10 w-full rounded-xl border border-slate-900 bg-slate-900/30 pl-9 pr-3 text-xs font-medium text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-700 focus:bg-slate-900/60 transition-all" 
            placeholder="Search MOC #, titles, systems, originators..." 
          />
        </label>

        {/* Status drop field */}
        <div className="relative block">
          <select 
            value={filters.status ?? ''} 
            onChange={(event) => setFilter('status', event.target.value || undefined)} 
            className="h-10 w-full appearance-none rounded-xl border border-slate-900 bg-slate-900/30 px-3 text-xs font-semibold text-slate-300 outline-none focus:border-slate-700 focus:bg-slate-900/60 cursor-pointer pr-8"
          >
            <option value="" className="bg-slate-950 text-slate-400">All Statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item} className="bg-slate-950 text-slate-200">{item}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 border-l border-slate-900/80 pl-2">
            <span className="text-[9px]">▼</span>
          </div>
        </div>

        {/* Risk profile selection */}
        <div className="relative block">
          <select 
            value={filters.risk_level ?? ''} 
            onChange={(event) => setFilter('risk_level', event.target.value || undefined)} 
            className="h-10 w-full appearance-none rounded-xl border border-slate-900 bg-slate-900/30 px-3 text-xs font-semibold text-slate-300 outline-none focus:border-slate-700 focus:bg-slate-900/60 cursor-pointer pr-8"
          >
            <option value="" className="bg-slate-950 text-slate-400">All Risks</option>
            {risks.map((item) => (
              <option key={item} value={item} className="bg-slate-950 text-slate-200">{item}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 border-l border-slate-900/80 pl-2">
            <span className="text-[9px]">▼</span>
          </div>
        </div>

        {/* Core modification classification */}
        <div className="relative block">
          <select 
            value={filters.change_type ?? ''} 
            onChange={(event) => setFilter('change_type', event.target.value || undefined)} 
            className="h-10 w-full appearance-none rounded-xl border border-slate-900 bg-slate-900/30 px-3 text-xs font-semibold text-slate-300 outline-none focus:border-slate-700 focus:bg-slate-900/60 cursor-pointer pr-8"
          >
            <option value="" className="bg-slate-950 text-slate-400">All Change Types</option>
            {types.map((item) => (
              <option key={item} value={item} className="bg-slate-950 text-slate-200">{item}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 border-l border-slate-900/80 pl-2">
            <span className="text-[9px]">▼</span>
          </div>
        </div>

        {/* Size limiting controls */}
        <div className="relative block">
          <select 
            value={String(filters.limit ?? 25)} 
            onChange={(event) => setFilter('limit', Number(event.target.value))} 
            className="h-10 w-full appearance-none rounded-xl border border-slate-900 bg-slate-900/30 px-3 text-xs font-semibold text-slate-300 outline-none focus:border-slate-700 focus:bg-slate-900/60 cursor-pointer pr-8"
          >
            {[10, 25, 50, 100].map((item) => (
              <option key={item} value={item} className="bg-slate-950 text-slate-200">{item} / Page</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500 border-l border-slate-900/80 pl-2">
            <span className="text-[9px]">▼</span>
          </div>
        </div>

      </div>

      {/* Auxiliary Breakdown Scope Parameters Grid */}
      <div className="mt-3 grid gap-3 grid-cols-2 md:grid-cols-4">
        <input 
          value={filters.department_id ?? ''} 
          onChange={(event) => setFilter('department_id', event.target.value || undefined)} 
          className="h-9 rounded-xl border border-slate-900 bg-slate-900/10 px-3 text-xs font-medium text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-800 focus:bg-slate-900/30 transition-all" 
          placeholder="Department ID" 
        />
        <input 
          value={filters.unit_id ?? ''} 
          onChange={(event) => setFilter('unit_id', event.target.value || undefined)} 
          className="h-9 rounded-xl border border-slate-900 bg-slate-900/10 px-3 text-xs font-medium text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-800 focus:bg-slate-900/30 transition-all" 
          placeholder="Unit ID" 
        />
        <input 
          value={filters.area_id ?? ''} 
          onChange={(event) => setFilter('area_id', event.target.value || undefined)} 
          className="h-9 rounded-xl border border-slate-900 bg-slate-900/10 px-3 text-xs font-medium text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-800 focus:bg-slate-900/30 transition-all" 
          placeholder="Area ID" 
        />
        <input 
          value={filters.originator_id ?? ''} 
          onChange={(event) => setFilter('originator_id', event.target.value || undefined)} 
          className="h-9 rounded-xl border border-slate-900 bg-slate-900/10 px-3 text-xs font-medium text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-800 focus:bg-slate-900/30 transition-all" 
          placeholder="Originator ID" 
        />
      </div>

      {/* Instant Action Macro Badges Row */}
      <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-900/80">
        {[
          ['High / Critical', { risk_level: 'High' }],
          ['Temporary Only', { is_temporary: true }],
          ['Emergency Only', { is_emergency: true }],
          ['Startup Blocked', { startup_blocked: true }],
          ['Closure Blocked', { closure_blocked: true }],
          ['Overdue Actions', { overdue_actions: true }],
          ['PSSR Pending', { pssr_pending: true }],
          ['Missing Evidence', { missing_evidence: true }],
          ['Pending Verification', { pending_verification: true }]
        ].map(([label, targetConfig]: any) => {
          const isActive = isQuickFilterActive(targetConfig);
          return (
            <button
              key={label}
              onClick={() => setFilters(targetConfig)}
              className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all duration-150 focus:outline-none ${
                isActive
                  ? 'bg-sky-500/15 border-sky-400 text-sky-400'
                  : 'border-slate-900 bg-slate-900/20 text-slate-400 hover:border-slate-800 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

    </section>
  );
}