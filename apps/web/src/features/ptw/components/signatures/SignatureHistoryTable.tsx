'use client';

import { useState } from 'react';
import { History, ChevronDown, ChevronUp } from 'lucide-react';
import type { SignatureHistory } from '../../services/ptw-signature.service';

export function SignatureHistoryTable({ rows = [] }: { rows?: SignatureHistory[] | undefined }) {
  const [viewAll, setViewAll] = useState<boolean>(false);

  // Enforce clean structural thresholds (hides items past index 4 by default)
  const displayedRows = viewAll ? rows : rows.slice(0, 4);
  const hasHiddenRows = rows.length > 4;

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md transition-all duration-200">
      
      {/* 1. Clean Premium Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/60 gap-3">
        <div className="flex items-center gap-2.5 text-slate-200">
          <History size={18} className="text-sky-400" /> 
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Signature History
          </h3>
          <span className="rounded-full border border-slate-800 bg-slate-950 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400">
            {rows.length} {rows.length === 1 ? 'log' : 'logs'}
          </span>
        </div>

        {/* Minimalist Action Trigger Button */}
        {hasHiddenRows && (
          <button
            type="button"
            onClick={() => setViewAll(!viewAll)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-slate-100 active:scale-95"
          >
            <span>{viewAll ? 'Show Less' : `View All (${rows.length})`}</span>
            {viewAll ? <ChevronUp size={14} className="text-sky-400" /> : <ChevronDown size={14} className="text-sky-400" />}
          </button>
        )}
      </div>

      {/* 2. Main Premium Table Structure */}
      {rows.length > 0 ? (
        <div 
          className="overflow-auto mt-4 rounded-lg border border-slate-800/60 bg-slate-950/40 max-h-[520px]
            [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2
            [&::-webkit-scrollbar-track]:bg-slate-950/60
            [&::-webkit-scrollbar-track]:rounded-lg
            [&::-webkit-scrollbar-thumb]:bg-slate-800
            [&::-webkit-scrollbar-thumb]:rounded-lg
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-700
            [&::-webkit-scrollbar-corner]:bg-transparent"
        >
          <table className="w-full min-w-[780px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/95 border-b border-slate-800 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
                {['Event Type', 'Audit Description', 'Operator / User', 'Timestamp', 'State Delta Transition'].map((head) => (
                  <th 
                    key={head} 
                    className="px-4 py-3 font-bold uppercase tracking-wider text-[10px] select-none whitespace-nowrap"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {displayedRows.map((row) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-slate-800/20 transition-colors duration-150 ease-in-out align-top"
                >
                  {/* Event Flag Name Column */}
                  <td className="px-4 py-3.5 font-bold text-slate-200 tracking-wide uppercase text-[11px] whitespace-nowrap">
                    {row.event_type}
                  </td>
                  
                  {/* Detailed Description Context Column */}
                  <td className="px-4 py-3.5 text-slate-300 leading-relaxed font-normal max-w-xs xl:max-w-md">
                    {row.description}
                  </td>
                  
                  {/* Acting User ID Handle Column */}
                  <td className="px-4 py-3.5 font-semibold text-slate-400 whitespace-nowrap">
                    {row.user_id ?? (
                      <span className="text-slate-600 font-sans tracking-normal font-normal">-</span>
                    )}
                  </td>
                  
                  {/* Iso Chrono Generation Timestamp Column */}
                  <td className="px-4 py-3.5 font-mono text-slate-400 tracking-wide whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  
                  {/* Custom Delta Flow-State Column */}
                  <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-800/60 bg-slate-900/80 px-2 py-1 text-slate-400">
                      <span className={row.before_value ? 'text-amber-400' : 'text-emerald-400'}>
                        {row.before_value ? 'Changed' : 'Created'}
                      </span>
                      <span className="text-slate-600 font-sans">→</span>
                      <span className={row.after_value ? 'text-sky-400' : 'text-slate-600'}>
                        {row.after_value ? 'Recorded' : '-'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* 3. Pure Empty State Fallback Screen */
        <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/20 p-8 text-center text-xs font-medium text-slate-500 mt-4">
          No signoff historical records or cryptographic verification footprints attached yet.
        </div>
      )}
    </section>
  );
}