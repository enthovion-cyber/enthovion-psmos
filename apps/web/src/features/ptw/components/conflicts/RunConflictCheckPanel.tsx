'use client';

import { RefreshCw, ShieldAlert } from 'lucide-react';
import type { ConflictSummary } from '../../services/ptw-conflict.service';

export function RunConflictCheckPanel({ 
  summary, 
  running, 
  onRun 
}: { 
  summary?: ConflictSummary | undefined; 
  running?: boolean | undefined; 
  onRun: () => void 
}) {
  // Graceful fallback scope data metrics mapping
  const scopeItems = summary?.checkScope ?? [
    'Same equipment', 
    'Same area', 
    'Same process unit', 
    'Nearby radius', 
    'Incompatible permit matrix', 
    'SIMOPS rules'
  ];

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md">
      
      {/* Title Header Layout Strip */}
      <div className="mb-4 flex items-center gap-2">
        <ShieldAlert size={16} className="text-sky-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          Run Conflict Check
        </h3>
      </div>

      {/* Main Metadata Grid Frame */}
      <div className="space-y-3 text-xs text-slate-400">
        <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
          <span className="font-medium">Last checked by:</span>
          <span className="font-semibold text-slate-200 font-mono">
            {summary?.lastCheckedBy ?? '-'}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-1.5 border-b border-slate-800/40">
          <span className="font-medium">Last checked at:</span>
          <span className="font-semibold text-slate-200 font-mono">
            {summary?.lastCheckedAt 
              ? new Date(summary.lastCheckedAt).toLocaleString() 
              : 'Never'
            }
          </span>
        </div>
        
        {/* Verification Matrix Scope Badges */}
        <div className="pt-2">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Automated Audit Rules Included:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {scopeItems.map((scope) => (
              <span 
                key={scope} 
                className="inline-flex rounded-md border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-slate-950 hover:text-slate-100"
              >
                {scope}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* High-Contrast Interactive Execution Action Module */}
      <button 
        type="button"
        onClick={onRun} 
        disabled={running} 
        className={`inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md w-full mt-4 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/40
          ${running 
            ? 'opacity-60 cursor-not-allowed bg-slate-800 text-slate-400 border border-slate-700/50' 
            : 'hover:bg-sky-500 active:scale-[0.99] shadow-lg shadow-sky-950/20'
          }`}
      >
        <RefreshCw 
          size={14} 
          className={`transition-transform ${running ? 'animate-spin text-slate-500' : 'text-white'}`} 
        />
        <span>{running ? 'Scanning Matrices...' : 'Execute Live Conflict Check'}</span>
      </button>
    </section>
  );
}