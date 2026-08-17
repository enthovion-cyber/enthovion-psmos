'use client';

import { TimelineEventCard } from '../shared/TimelineEventCard';
import type { MiHistoryEvent } from '../types/mi-history.types';

export function MiHistoryTimeline({ rows = [], groups }: { rows?: MiHistoryEvent[] | undefined; groups?: Record<string, MiHistoryEvent[]> | undefined }) {
  const grouped = groups ?? rows.reduce<Record<string, MiHistoryEvent[]>>((acc, event) => {
    const key = new Date(event.eventAt).toLocaleDateString();
    acc[key] = [...(acc[key] ?? []), event];
    return acc;
  }, {});

  if (!Object.keys(grouped).length) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-sm text-[var(--psm-muted)]">
        Timeline is empty. Events will appear here after MI changes, approvals, exports, or synced audit records exist.
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {Object.entries(grouped).map(([group, events]) => (
        <div key={group} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--psm-muted)]">{group}</h2>
          <div className="mt-4 space-y-3">
            {events.map((event) => <TimelineEventCard key={event.id} event={event} />)}
          </div>
        </div>
      ))}
    </section>
  );
}
