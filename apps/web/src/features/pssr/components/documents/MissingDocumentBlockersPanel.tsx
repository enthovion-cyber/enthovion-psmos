'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function MissingDocumentBlockersPanel({ blockers }: { blockers: any[] }) {
  // 1. Control view expansion state
  const [isExpanded, setIsExpanded] = useState(false);

  const MAX_INITIAL_ITEMS = 4;
  
  // 2. Slice array cleanly based on state toggle
  const visibleBlockers = isExpanded 
    ? blockers 
    : blockers.slice(0, MAX_INITIAL_ITEMS);

  const hasMoreItems = blockers.length > MAX_INITIAL_ITEMS;

  return (
    <PSSRCard title={`Missing Document Blockers (${blockers.length})`}>
      {blockers.length > 0 ? (
        <div className="space-y-4">
          
          {/* Vertical Stack List */}
          <div className="space-y-3">
            {visibleBlockers.map((item) => {
              const isHighSeverity = item.severity === 'High';

              return (
                <div 
                  key={item.id} 
                  className={`group flex gap-3 rounded-xl border p-4 transition-all duration-200 ${
                    isHighSeverity 
                      ? 'border-red-500/20 bg-red-950/20 hover:bg-red-950/30' 
                      : 'border-amber-500/15 bg-amber-950/10 hover:bg-amber-950/20'
                  }`}
                >
                  {/* Warning Icon alignment wrapper */}
                  <div className="mt-0.5 shrink-0">
                    <AlertTriangle 
                      className={isHighSeverity ? 'text-red-400' : 'text-amber-400'} 
                      size={18} 
                    />
                  </div>

                  {/* Main text content wrapper */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-sm text-red-50 leading-tight group-hover:text-red-300 transition-colors">
                        {item.title}
                      </p>
                      <Badge tone={isHighSeverity ? 'red' : 'amber'}>
                        {item.severity}
                      </Badge>
                    </div>

                    {item.description && (
                      <p className="text-xs text-red-100/70 leading-relaxed max-w-2xl">
                        {item.description}
                      </p>
                    )}
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
                <span>{isExpanded ? 'Show Less' : `View All Document Blockers (${blockers.length})`}</span>
                <span className="text-[10px] opacity-70">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>
            </div>
          )}

        </div>
      ) : (
        <EmptyState 
          title="No document blockers" 
          detail="Missing, obsolete, unapproved, version mismatch, and pending verification blockers appear here." 
        />
      )}
    </PSSRCard>
  );
}