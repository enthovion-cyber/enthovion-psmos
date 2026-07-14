import React, { useMemo } from 'react';
import { AlertTriangle, ShieldAlert, Layers, CheckCircle } from 'lucide-react';
import type { PermitConflict } from '@/services/ptw.service';

interface ConflictPanelProps {
  data?: Record<string, any>;
}

export function ConflictPanel({ data }: ConflictPanelProps) {
  // Safely grab structural array datasets directly from data properties
  const open = (data?.open ?? []) as PermitConflict[];
  const critical = (data?.critical ?? []) as PermitConflict[];
  const high = (data?.high ?? []) as PermitConflict[];
  const overridePending = (data?.overridePending ?? []) as any[];

  return (
    <section className="w-full max-w-md rounded-xl border border-slate-800/80 bg-[#070f1e] p-5 shadow-2xl select-none">
      
      {/* Header Container */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert size={16} className="text-red-400" />
          Conflicts / SIMOPS
        </h3>
        <a 
          href="/ptw?hasConflict=true" 
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5"
        >
          View conflicts →
        </a>
      </div>

      {/* Metric Aggregates Row Grid */}
      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <MetricCard label="Open" value={open.length} tone="text-red-400" />
        <MetricCard label="Critical" value={critical.length} tone="text-rose-500 font-black animate-pulse" />
        <MetricCard label="High Risk" value={high.length} tone="text-amber-400" />
      </div>

      {/* Operational Overrides Context Row */}
      <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/20 px-3 py-2 text-xs transition-all hover:bg-slate-900/40">
        <span className="font-medium text-slate-400 flex items-center gap-1.5">
          <Layers size={12} className="text-slate-500" />
          Override approvals pending
        </span>
        <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
          overridePending.length > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-950/40 text-slate-500'
        }`}>
          {overridePending.length}
        </span>
      </div>

      {/* Real-Time Live Conflict Queue Timeline Stream */}
      <div className="mt-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
          <AlertTriangle size={12} className="text-red-400" /> Active Threat Queue
        </div>

        {/* Max Height Restricted Stream Window supporting up to 4 items with custom scroll track bars */}
        <div 
          className="space-y-1.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent hover:scrollbar-thumb-slate-700 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
          style={{ maxHeight: '210px' }}
        >
          {open.map((conflict) => {
            const isCritical = conflict.severity === 'Critical' || conflict.risk_level === 'Critical';
            
            return (
              <div 
                key={conflict.id} 
                className={`rounded-md border p-2.5 text-xs transition-all ${
                  isCritical 
                    ? 'border-red-500/20 bg-red-950/10 hover:bg-red-950/20 text-red-400' 
                    : 'border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2 font-mono font-bold truncate">
                  <AlertTriangle size={12} className={`mt-0.5 flex-shrink-0 ${isCritical ? 'text-red-400 animate-bounce' : 'text-amber-400'}`} />
                  <span className="truncate">{conflict.conflict_type || 'Co-Location Risk'}</span>
                </div>
                {conflict.description && (
                  <p className="mt-1 text-slate-400 text-[11px] font-medium leading-normal break-words">
                    {conflict.description}
                  </p>
                )}
              </div>
            );
          })}

          {/* Secure Safe Clean Operations Empty Placeholder */}
          {!open.length && (
            <div className="py-6 text-center rounded-lg border border-dashed border-slate-800 bg-slate-950/10">
              <CheckCircle size={18} className="mx-auto text-emerald-500 mb-1.5" />
              <p className="text-xs text-slate-500 font-medium">No operational conflicts detected in sector.</p>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}

/**
 * Isolated Metric Card Layout Element preventing internal element cell text-overflows
 */
function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded border border-slate-800/40 bg-[#040914] p-2 flex flex-col items-center justify-center min-w-0 text-center">
      <div className={`text-xl font-black font-mono tracking-tight truncate w-full ${tone}`}>
        {value}
      </div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 truncate w-full">
        {label}
      </div>
    </div>
  );
}