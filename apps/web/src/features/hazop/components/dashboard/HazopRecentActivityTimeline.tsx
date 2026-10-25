import Link from 'next/link';

export function HazopRecentActivityTimeline({ events }: { events: any[] }) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3.5 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs sm:text-sm font-semibold text-[var(--psm-text)]">Recent HAZOP Activity</h3>
          <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {events.length}
          </span>
        </div>
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">View all</span>
      </div>
      <div className="space-y-2 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
        {events.slice(0, 10).map((event) => (
          <Link 
            key={event.id} 
            href={`/hazop/${event.study_id}?tab=History`} 
            className="flex items-start gap-2.5 rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)]/40 p-2.5 hover:bg-[var(--psm-surface-2)] transition"
          >
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500 ring-4 ring-blue-500/10" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-[var(--psm-text)]">
                {event.title ?? event.event_type ?? 'HAZOP event'}
              </div>
              {event.description && (
                <div className="mt-0.5 line-clamp-2 text-[11px] text-[var(--psm-muted)] leading-relaxed">
                  {event.description}
                </div>
              )}
              <div className="mt-1 text-[10px] text-[var(--psm-muted)] font-medium">
                {event.created_at ? new Date(event.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
            </div>
          </Link>
        ))}
        {!events.length && (
          <div className="rounded-lg border border-dashed border-[var(--psm-line)] p-6 text-center text-xs text-[var(--psm-muted)]">
            No HAZOP history events recorded yet.
          </div>
        )}
      </div>
    </section>
  );
}
