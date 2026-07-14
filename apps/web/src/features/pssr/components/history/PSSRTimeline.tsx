'use client';
import { useState } from 'react';
import { EmptyState, PSSRCard } from '../pssr-ui';
import { PSSRHistoryEventCard } from './PSSRHistoryEventCard';

export function PSSRTimeline({ 
  events, 
  onSelect 
}: { 
  events: any[]; 
  onSelect: (event: any) => void 
}) {
  // 1. Manage layout timeline expansion state
  const [isExpanded, setIsExpanded] = useState(false);

  const MAX_INITIAL_ITEMS = 4;

  // 2. Slice array cleanly based on state toggle
  const visibleEvents = isExpanded 
    ? events 
    : events.slice(0, MAX_INITIAL_ITEMS);

  const hasMoreItems = events.length > MAX_INITIAL_ITEMS;

  return (
    <PSSRCard title={`Timeline Timeline (${events.length})`}>
      {events.length > 0 ? (
        <div className="space-y-4">
          
          {/* Vertical Stack List with a subtle relative line connector concept layout */}
          <div className="relative space-y-3 pl-2 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[1px] before:bg-white/5">
            {visibleEvents.map((event) => (
              <div key={event.id} className="relative transition-all duration-200">
                {/* Visual indicator node dot */}
                <div className="absolute -left-[3px] top-[18px] h-1.5 w-1.5 rounded-full bg-cyan-500/40 ring-4 ring-slate-950" />
                
                <PSSRHistoryEventCard 
                  event={event} 
                  onSelect={onSelect} 
                />
              </div>
            ))}
          </div>

          {/* "View All" Toggle Control Button Banner panel */}
          {hasMoreItems && (
            <div className="mt-4 flex justify-center border-t border-white/5 pt-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-black text-cyan-200 transition-all hover:bg-cyan-500/20 hover:border-cyan-500/40 active:scale-95"
              >
                <span>{isExpanded ? 'Show Less' : `View All Timeline (${events.length})`}</span>
                <span className="text-[10px] opacity-70">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>
            </div>
          )}

        </div>
      ) : (
        <div className="py-6">
          <EmptyState title="No PSSR history events recorded yet." />
        </div>
      )}
    </PSSRCard>
  );
}