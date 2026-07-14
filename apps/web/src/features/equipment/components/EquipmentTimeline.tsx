'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock3, History } from 'lucide-react';
import type { EquipmentTimelineEvent } from '@/services/equipment.service';

const pageSize = 5;

export function EquipmentTimeline({ events }: { events: EquipmentTimelineEvent[] }) {
  const [page, setPage] = useState(1);
  const sorted = useMemo(() => [...events].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()), [events]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageEvents = sorted.slice((page - 1) * pageSize, page * pageSize);

  // Helper function to extract short date format (e.g., "15 MAR 2019")
  const formatTimelineDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'SHORT' }).toUpperCase();
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="psm-card overflow-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-info/10 text-info">
            <History size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide">Equipment Timeline</h2>
            <p className="mt-1 text-xs text-[var(--psm-muted)]">Showing {pageEvents.length} of {events.length} events</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button type="button" className="psm-button psm-button-secondary min-h-9 px-3" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="rounded-lg border border-[var(--psm-line)] px-3 py-2 text-xs font-semibold text-[var(--psm-muted)]">Page {page} / {totalPages}</span>
          <button type="button" className="psm-button psm-button-secondary min-h-9 px-3" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {events.length === 0 ? (
        <div className="grid min-h-64 place-items-center p-6 text-center">
          <div>
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--psm-surface-3)] text-[var(--psm-muted)]">
              <Clock3 size={22} />
            </div>
            <div className="mt-3 font-semibold">No timeline events recorded</div>
            <p className="mt-2 max-w-md text-sm text-[var(--psm-muted)]">Equipment changes, inspections, documents, QR generation, and linked module activity will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="max-h-[calc(100vh-270px)] min-h-[360px] overflow-auto p-6 bg-[var(--psm-surface)]">
          <div className="relative space-y-6">
            
            {/* The vertical timeline track line matching the mockup */}
            <div className="absolute bottom-6 left-[17px] top-4 w-0.5 bg-[var(--psm-line)]" />
            
            {pageEvents.map((event) => (
              <article key={event.id} className="relative flex items-start gap-4">
                
                {/* Visual Timeline Node Icon */}
                <div className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-info/30 bg-info/10 text-info">
                  <Clock3 size={16} />
                </div>
                
                {/* Context Content Box */}
                <div className="min-w-0 flex-1 pt-1.5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
                    
                    {/* Timestamp Block aligned side-by-side with content */}
                    <span className="w-28 shrink-0 text-xs font-bold uppercase tracking-wide text-[var(--psm-muted)]">
                      {formatTimelineDate(event.occurredAt)}
                    </span>
                    
                    {/* Text Details Container */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold tracking-wide text-white">{event.title}</h3>
                      
                      {event.description && (
                        <p className="mt-0.5 text-xs text-[var(--psm-muted)] leading-relaxed">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="mt-1 text-xs text-[var(--psm-muted)] font-medium">
                        by <span className="text-[var(--psm-muted)] opacity-90">{event.actorName ?? 'System'}</span>
                      </div>

                      {/* Technical Meta Badges kept from your original architecture */}
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                        <span className="rounded bg-[var(--psm-surface-2)] border border-[var(--psm-line)] px-1.5 py-0.5 uppercase font-medium text-[var(--psm-muted)]">
                          {event.eventType.replaceAll('_', ' ')}
                        </span>
                        {event.sourceType && (
                          <span className="rounded bg-[var(--psm-surface-2)] border border-[var(--psm-line)] px-1.5 py-0.5 uppercase font-medium text-[var(--psm-muted)]">
                            {event.sourceType}
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}