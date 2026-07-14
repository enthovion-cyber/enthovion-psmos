'use client';

import { useState } from 'react';
import { History, Eye, ArrowRightLeft, ChevronDown, ChevronUp } from 'lucide-react';
import type { HandoverHistory as HandoverHistoryRow } from '../../services/ptw-handover.service';

interface HandoverHistoryTableProps {
  rows?: HandoverHistoryRow[] | undefined;
  loading?: boolean | undefined;
}

export function HandoverHistoryTable({ rows = [], loading }: HandoverHistoryTableProps) {
  const [viewAll, setViewAll] = useState<boolean>(false);

  // Enforce structural limits (Slices view to exactly 4 items by default)
  const displayedRows = viewAll ? rows : rows.slice(0, 4);
  const hasHiddenRows = rows.length > 4;

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-6 shadow-2xl backdrop-blur-md transition-all duration-200">
      
      {/* 1. Clean Premium Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5 text-slate-200">
          <History size={18} className="text-slate-400" /> 
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Handover History
          </h3>
        </div>

        {/* Minimalist Action Trigger Button */}
        {!loading && hasHiddenRows && (
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

      {/* 2. Loading State Placeholder */}
      {loading ? (
        <div className="py-12 text-center text-xs font-medium tracking-wide text-slate-400 bg-slate-950/40 border border-slate-800/40 rounded-lg mt-4 animate-pulse">
          Loading shift handover historical database records...
        </div>
      ) : null}

      {/* 3. Main Premium Table Structure */}
      {!loading && rows.length > 0 ? (
        <div 
          className="overflow-auto mt-4 rounded-lg border border-slate-800/60 bg-slate-950/40 max-h-[520px]
            [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-slate-800
            [&::-webkit-scrollbar-thumb]:rounded-md
            hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
        >
          <table className="w-full min-w-[900px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 sticky top-0 z-10 backdrop-blur-md">
                {['Handover Time', 'Event', 'Description', 'User', 'Actions'].map((head) => (
                  <th key={head} className="px-4 py-3 font-bold tracking-wider uppercase text-[10px] select-none">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {displayedRows.map((row) => (
                <tr 
                  key={row.id} 
                  className="hover:bg-slate-800/30 transition-colors duration-150 ease-in-out"
                >
                  {/* Timestamp Format Column */}
                  <td className="px-4 py-3.5 font-mono text-slate-400 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </td>
                  
                  {/* Flat Clean Event Tags Column */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-200 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                      <ArrowRightLeft size={12} className="text-slate-500" />
                      {row.event_type}
                    </span>
                  </td>
                  
                  {/* Description Context String Column */}
                  <td className="px-4 py-3.5 text-slate-300 max-w-xs truncate xl:max-w-md font-normal leading-relaxed" title={row.description}>
                    {row.description}
                  </td>
                  
                  {/* Operator Identifier Column */}
                  <td className="px-4 py-3.5 text-slate-400 font-medium whitespace-nowrap">
                    {row.user_id ?? 'System'}
                  </td>
                  
                  {/* Premium Action Control Trigger Button Column */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <button 
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300 transition-all hover:bg-sky-500/10 hover:border-sky-500/40 hover:text-sky-400 active:scale-95"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* 4. Pure Empty State Fallback */}
      {!loading && !rows.length ? (
        <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/20 p-8 text-center text-xs font-medium text-slate-500 mt-4">
          No shift handover history records available on this platform.
        </div>
      ) : null}
    </section>
  );
}