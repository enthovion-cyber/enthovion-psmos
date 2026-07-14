'use client';

import { useState } from 'react';
import { Clock3 } from 'lucide-react';
import { EmptyState, PSSRCard, Badge } from '../pssr-ui';

export function PSSRLatestActivity({ pssr }: { pssr: any }) {
  // 1. Manage state toggle for view depth expansion
  const [isExpanded, setIsExpanded] = useState(false);

  const history = pssr.history ?? [];
  
  // 2. Bound total slice bounds (Upper limit of 8 from original requirement)
  const totalHistoryPool = history.slice(0, 8);
  
  const MAX_INITIAL_ITEMS = 4;
  const hasMoreItems = totalHistoryPool.length > MAX_INITIAL_ITEMS;

  // 3. Slice pool based on active state criteria
  const visibleHistory = isExpanded 
    ? totalHistoryPool 
    : totalHistoryPool.slice(0, MAX_INITIAL_ITEMS);

  return (
    <PSSRCard title="Latest System Activity">
      {history.length > 0 ? (
        <div className="space-y-4">
          
          {/* Vertical Timeline Activity Feed Grid wrapper */}
          <div className="relative space-y-4 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-cyan-500/10">
            {visibleHistory.map((item: any) => {
              const isSafetyCritical = item.is_safety_critical;

              return (
                <div key={item.id} className="relative flex gap-4 group">
                  
                  {/* Timeline Indicator Node Pin point */}
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-blue-950/40 text-blue-400 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-colors duration-150 shadow-sm z-10">
                    <Clock3 size={12} />
                  </div>

                  {/* Activity Event Context Container Block */}
                  <div className="min-w-0 flex-1 rounded-xl border border-white/5 bg-slate-900/30 p-4 transition-all duration-150 hover:bg-slate-900/50">
                    
                    {/* Header line context stack */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors leading-snug">
                        {item.event_title}
                      </p>
                      <Badge tone={isSafetyCritical ? 'red' : 'slate'}>
                        {item.event_category}
                      </Badge>
                    </div>

                    {/* Meta Event Description Block text strings */}
                    {item.description && (
                      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed max-w-2xl">
                        {item.description}
                      </p>
                    )}

                    {/* Absolute Timestamp Row indicator */}
                    <p className="mt-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                    </p>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Toggle for arrays scaling over 4 items threshold */}
          {hasMoreItems && (
            <div className="mt-4 flex justify-center border-t border-white/5 pt-3">
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-xs font-bold text-cyan-300 transition-all hover:bg-cyan-500/10 hover:border-cyan-500/40 active:scale-95"
              >
                <span>{isExpanded ? 'Show Less' : `View All Activity Events (${totalHistoryPool.length})`}</span>
                <span className="text-[10px] opacity-70">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>
            </div>
          )}

        </div>
      ) : (
        <EmptyState 
          title="No PSSR history yet" 
          detail="Lifecycle, readiness, checklist, and authorization events will be recorded here." 
        />
      )}
    </PSSRCard>
  );
}