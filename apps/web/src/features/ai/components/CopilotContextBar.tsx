'use client';

import { useState } from 'react';
import { Building2, ChevronDown, Database, Factory, Layers, ShieldCheck } from 'lucide-react';
import { useSiteContext } from '@/features/workspace/context/useSiteContext';
import { useCopilotStore } from '../stores/useCopilotStore';

export function CopilotContextBar() {
  const { data: tenantContext, selectedSite, corporateView } = useSiteContext();
  const { contextModule } = useCopilotStore();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const activeCompany =
    tenantContext?.companies?.find((c) => c.id === tenantContext.activeCompanyId) ||
    tenantContext?.companies?.[0];
  const companyName = activeCompany?.name || 'Enthovion Industrial';
  const siteName = selectedSite?.name || 'Active Site Facility';

  return (
    <div className="relative border-b border-slate-800/80 bg-[#070c18] px-4 py-2 text-xs select-none">
      <div className="flex items-center justify-between gap-2">
        {/* Scope Breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-blue-400 shrink-0">
            Scope:
          </span>

          <div className="flex items-center gap-1 truncate font-medium text-slate-200">
            <span className="truncate">{companyName}</span>
            <span className="text-slate-500">/</span>
            <span className="truncate text-blue-400 font-semibold">{siteName}</span>
            {contextModule && (
              <>
                <span className="text-slate-500">/</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-bold bg-[#0d1628] border border-slate-700 text-indigo-400">
                  {contextModule}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Scope Inspector Toggle */}
        <button
          type="button"
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-800 transition shrink-0 cursor-pointer"
          title="Inspect Context Boundary"
        >
          <Database className="w-3 h-3 text-blue-400" />
          <span className="hidden sm:inline">Data Boundary</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isPopoverOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Scope Details Popover */}
      {isPopoverOpen && (
        <div className="absolute top-full left-0 right-0 z-40 p-3 bg-[#0a1120] border-b border-slate-800 shadow-xl space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Active Authorization Boundaries
            </span>
            <span className="font-mono text-[10px] text-slate-500">Server-Enforced</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="p-2 rounded bg-[#0d1628] border border-slate-800">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Corporate View</div>
              <div className="font-semibold text-slate-200 mt-0.5">
                {corporateView ? 'Enabled (Multi-Site)' : 'Site Restricted'}
              </div>
            </div>
            <div className="p-2 rounded bg-[#0d1628] border border-slate-800">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Active Module</div>
              <div className="font-semibold text-slate-200 mt-0.5">
                {contextModule ? contextModule.toUpperCase() : 'Global Workspace'}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            The Copilot only queries authoritative Process Safety Information (PSI), verified Operating Procedures, and active permits within your assigned facility. Client-side scope switches cannot bypass server-side tenant policies.
          </p>
        </div>
      )}
    </div>
  );
}
