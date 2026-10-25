import React from 'react';
import { AlertTriangle, ShieldAlert, Layers, CheckCircle } from 'lucide-react';
import type { PermitConflict } from '@/services/ptw.service';

interface ConflictPanelProps {
  data?: Record<string, any>;
}

export function ConflictPanel({ data }: ConflictPanelProps) {
  const open = (data?.open ?? []) as PermitConflict[];
  const critical = (data?.critical ?? []) as PermitConflict[];
  const high = (data?.high ?? []) as PermitConflict[];
  const overridePending = (data?.overridePending ?? []) as any[];

  return (
    <section className="w-full h-full flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl select-none transition-all">
      {/* Header Container */}
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-red-500 dark:text-red-400" />
          Conflicts / SIMOPS
        </h3>
        <a
          href="/ptw?hasConflict=true"
          className="text-xs font-bold text-primary dark:text-sky-400 hover:underline transition-colors flex items-center gap-0.5"
        >
          View conflicts →
        </a>
      </div>

      {/* Metric Aggregates Row Grid */}
      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <MetricCard label="Open" value={open.length} tone="text-rose-600 dark:text-red-400" />
        <MetricCard label="Critical" value={critical.length} tone="text-red-600 dark:text-rose-500 font-black animate-pulse" />
        <MetricCard label="High Risk" value={high.length} tone="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Operational Overrides Context Row */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/20 px-3 py-2 text-xs transition-all hover:bg-slate-100 dark:hover:bg-slate-900/40">
        <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <Layers size={12} className="text-slate-400" />
          Override approvals pending
        </span>
        <span
          className={`font-mono font-bold px-1.5 py-0.5 rounded ${
            overridePending.length > 0
              ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20'
              : 'bg-slate-200/60 dark:bg-slate-950/40 text-slate-500'
          }`}
        >
          {overridePending.length}
        </span>
      </div>

      {/* Real-Time Live Conflict Queue Timeline Stream */}
      <div className="mt-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
          <AlertTriangle size={12} className="text-red-500 dark:text-red-400" /> Active Threat Queue
        </div>

        <div className="space-y-1.5 overflow-y-auto pr-1 custom-scrollbar max-h-[190px]">
          {open.map((conflict) => {
            const isCritical = conflict.severity === 'Critical' || (conflict as any).risk_level === 'Critical';

            return (
              <div
                key={conflict.id}
                className={`rounded-lg border p-2.5 text-xs transition-all ${
                  isCritical
                    ? 'border-red-200 dark:border-red-500/20 bg-red-50/70 dark:bg-red-950/20 text-red-700 dark:text-red-400'
                    : 'border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2 font-mono font-bold truncate">
                  <AlertTriangle
                    size={12}
                    className={`mt-0.5 shrink-0 ${isCritical ? 'text-red-500 dark:text-red-400 animate-bounce' : 'text-amber-500 dark:text-amber-400'}`}
                  />
                  <span className="truncate">{conflict.conflict_type || 'Co-Location Risk'}</span>
                </div>
                {conflict.description && (
                  <p className="mt-1 text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-relaxed break-words">
                    {conflict.description}
                  </p>
                )}
              </div>
            );
          })}

          {!open.length && (
            <div className="py-6 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10">
              <CheckCircle size={18} className="mx-auto text-emerald-500 mb-1.5" />
              <p className="text-xs text-slate-500 font-medium">No operational conflicts detected in sector.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800/40 bg-slate-50 dark:bg-[#040914] p-2 flex flex-col items-center justify-center min-w-0 text-center">
      <div className={`text-xl font-black font-mono tracking-tight truncate w-full ${tone}`}>
        {value}
      </div>
      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5 truncate w-full">
        {label}
      </div>
    </div>
  );
}
