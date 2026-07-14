'use client';
import { useState } from 'react';
import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function StartupBlockersPanel({ blockers }: { blockers: any[] }) {
  // 1. Control view expansion state
  const [isExpanded, setIsExpanded] = useState(false);

  const MAX_INITIAL_ITEMS = 4;
  
  // 2. Slice blockers array cleanly based on expansion state
  const visibleBlockers = isExpanded 
    ? blockers 
    : blockers.slice(0, MAX_INITIAL_ITEMS);

  const hasMoreItems = blockers.length > MAX_INITIAL_ITEMS;

  return (
    <PSSRCard title={`Startup Blockers Panel (${blockers.length})`}>
      {blockers.length > 0 ? (
        <div className="space-y-4">
          
          {/* Vertical Stack List */}
          <div className="space-y-3">
            {visibleBlockers.map((item) => {
              const isHardBlocker = item.startupBlocking !== false;

              return (
                <div 
                  key={item.id} 
                  className={`group relative rounded-xl border p-4 transition-all duration-200 ${
                    isHardBlocker 
                      ? 'border-red-500/20 bg-red-950/20 hover:bg-red-950/30' 
                      : 'border-amber-500/15 bg-amber-950/10 hover:bg-amber-950/20'
                  }`}
                >
                  {/* Top Line: Title & Blocking Status Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white leading-tight group-hover:text-red-400 transition-colors">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <Badge tone={isHardBlocker ? 'red' : 'amber'}>
                      {isHardBlocker ? 'Blocks Startup' : 'Non-blocking'}
                    </Badge>
                  </div>

                  {/* Bottom Line: Metadata Footer block */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/5 pt-2 text-[11px] font-medium text-slate-500">
                    <span className="text-slate-400 font-semibold">{item.sourceModule}</span>
                    <span className="text-white/20">•</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      String(item.status).toLowerCase() === 'open' 
                        ? 'bg-red-500/10 text-red-400' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.status ?? 'Open'}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="text-slate-400 font-mono">{item.severity}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* "View All" Expand/Collapse Control Panel Trigger */}
          {hasMoreItems && (
            <div className="mt-4 flex justify-center border-t border-white/5 pt-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-200 transition-all hover:bg-red-500/20 hover:border-red-500/40 active:scale-95"
              >
                <span>{isExpanded ? 'Show Less' : `View All Blockers (${blockers.length})`}</span>
                <span className="text-[10px] opacity-70">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>
            </div>
          )}

        </div>
      ) : (
        <EmptyState 
          title="No startup authorization blockers" 
          detail="All hard startup gates are clear." 
        />
      )}
    </PSSRCard>
  );
}