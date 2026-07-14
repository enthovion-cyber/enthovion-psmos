'use client';
import { useState } from 'react';
import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function AuthorizationHistory({ history }: { history: any[] }) {
  // 1. Control view expansion state
  const [isExpanded, setIsExpanded] = useState(false);

  const MAX_INITIAL_ITEMS = 3;
  
  // 2. Slice history array cleanly based on expansion state
  const visibleHistory = isExpanded 
    ? history 
    : history.slice(0, MAX_INITIAL_ITEMS);

  const hasMoreItems = history.length > MAX_INITIAL_ITEMS;

  return (
    <PSSRCard title={`Authorization & Approval History (${history.length})`}>
      {history.length > 0 ? (
        <div className="space-y-4">
          
          {/* Vertical Stack List */}
          <div className="space-y-3">
            {visibleHistory.map((item) => {
              // Format date string beautifully
              const dateDisplay = item.created_at 
                ? new Date(item.created_at).toLocaleString(undefined, {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })
                : '-';

              return (
                <div 
                  key={item.id} 
                  className="group relative rounded-xl border border-white/5 bg-slate-900/40 p-4 transition-all duration-200 hover:border-white/10 hover:bg-slate-900/70"
                >
                  {/* Top Line: Title & Type Indicator Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-bold text-sm text-white leading-tight group-hover:text-cyan-400 transition-colors">
                      {item.event_title}
                    </p>
                    <Badge tone={getToneForEventType(item.event_type)}>
                      {item.event_type}
                    </Badge>
                  </div>

                  {/* Middle Line: Core Description Details */}
                  {item.description && (
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Bottom Line: Timestamp & Responsibility Marker Meta */}
                  <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px] font-medium text-slate-500">
                    <div className="flex items-center gap-1">
                      <span>👤</span>
                      <span className="text-slate-400 font-semibold">{item.user_id ?? 'System Action'}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono">
                      <span>🕒</span>
                      <span>{dateDisplay}</span>
                    </div>
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-200 transition-all hover:bg-cyan-500/20 hover:border-cyan-500/40 active:scale-95"
              >
                <span>{isExpanded ? 'Show Less' : `View All History (${history.length})`}</span>
                <span className="text-[10px] opacity-70">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>
            </div>
          )}

        </div>
      ) : (
        <div className="py-6">
          <EmptyState title="No authorization history yet" />
        </div>
      )}
    </PSSRCard>
  );
}

/**
 * Helper utility to change Badge colors dynamically based on event type contexts
 */
function getToneForEventType(type: string): 'green' | 'red' | 'cyan' | 'slate' {
  const normalized = String(type).toLowerCase();
  if (normalized.includes('approve') || normalized.includes('grant') || normalized.includes('sign')) {
    return 'green';
  }
  if (normalized.includes('reject') || normalized.includes('revoke') || normalized.includes('deny')) {
    return 'red';
  }
  if (normalized.includes('update') || normalized.includes('edit')) {
    return 'cyan';
  }
  return 'slate';
}