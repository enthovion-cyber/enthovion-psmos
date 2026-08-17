import { HistoryEventTypeBadge } from './HistoryEventTypeBadge';
import type { MiHistoryEvent } from '../types/mi-history.types';

export function TimelineEventCard({ event }: { event: MiHistoryEvent }) {
  return (
    <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">{event.eventTitle}</p>
          <p className="text-sm text-[var(--psm-muted)]">{event.sourceModule} - {event.sourceRecordNumber ?? event.sourceRecordId ?? 'No source number'}</p>
        </div>
        <HistoryEventTypeBadge type={event.eventType} />
      </div>
      <p className="mt-2 text-sm text-[var(--psm-muted)]">{event.eventDescription ?? 'No event description recorded.'}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--psm-muted)]">
        <span>{new Date(event.eventAt).toLocaleString()}</span>
        <span>Actor: {event.actorUserId ?? 'System'}</span>
        {event.beforeAfterAvailable ? <span>Before/after available</span> : null}
        {event.readinessImpact ? <span>Readiness impact</span> : null}
      </div>
    </article>
  );
}
