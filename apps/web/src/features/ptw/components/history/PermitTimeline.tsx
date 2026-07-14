'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, History, ListOrdered } from 'lucide-react';
import type { PermitHistoryEvent } from '../../services/ptw-history.service';
import { PermitHistoryEventCard } from './PermitHistoryEventCard';

export function PermitTimeline({ 
  rows = [], 
  loading = false, 
  onOpen 
}: { 
  rows?: PermitHistoryEvent[] | undefined; 
  loading?: boolean; 
  onOpen: (event: PermitHistoryEvent) => void 
}) {
  const [viewAll, setViewAll] = useState<boolean>(false);

  // Loading Placeholder View State
  if (loading) {
    return (
      <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md">
        <div className="mb-4 flex items-center gap-2 pb-3 border-b border-slate-800/60 animate-pulse">
          <div className="h-4 w-4 rounded bg-slate-800" />
          <div className="h-4 w-32 rounded bg-slate-800" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div 
              key={item} 
              className="h-28 animate-pulse rounded-xl bg-slate-950/60 border border-slate-800/40" 
            />
          ))}
        </div>
      </section>
    );
  }

  // Pure Empty Database State Fallback View State
  if (!rows?.length) {
    return (
      <section className="rounded-xl border border-dashed border-slate-800 bg-slate-950/20 p-8 text-center text-xs font-medium text-slate-500">
        <div className="mb-2 flex justify-center text-slate-600">
          <History size={24} />
        </div>
        No history timelines or structural tracking events recorded yet.
      </section>
    );
  }

  // Enforce structural visibility limits (slices view to maximum of 5 events by default)
  const displayedEvents = viewAll ? rows : rows.slice(0, 5);
  const hasHiddenRows = rows.length > 5;

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md w-full text-slate-100">
      
      {/* Premium Standardized Title Header Strip */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800/60 gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ListOrdered size={16} className="text-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Permit Lifecycle Timeline
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sequential system audit trail tracking authorizations, gas reviews, and structural transitions.
          </p>
        </div>
        <div className="inline-flex items-center justify-center rounded-full border border-slate-800 bg-slate-950 px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wide text-slate-400 self-start sm:self-auto shadow-inner">
          {rows.length} Total Snapshots
        </div>
      </div>

      {/* Interactive Core Chronological Log List Grid */}
      <div className="space-y-3 w-full">
        {displayedEvents.map((event) => (
          <PermitHistoryEventCard 
            key={event.id} 
            event={event} 
            onOpen={onOpen} 
          />
        ))}
      </div>

      {/* Premium "View All" Action Expansion Toggle Block */}
      {hasHiddenRows && (
        <div className="flex justify-center pt-3 mt-1 border-t border-slate-800/40">
          <button
            type="button"
            onClick={() => setViewAll(!viewAll)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold tracking-wide text-slate-300 transition-all hover:bg-slate-800 hover:text-slate-100 active:scale-98 shadow-md"
          >
            <History size={13} className="text-sky-400" />
            <span>
              {viewAll ? 'Show Recent 5 Logs' : `View Full Audit Trail (${rows.length})`}
            </span>
            {viewAll ? (
              <ChevronUp size={14} className="text-sky-400" />
            ) : (
              <ChevronDown size={14} className="text-sky-400" />
            )}
          </button>
        </div>
      )}
    </section>
  );
}