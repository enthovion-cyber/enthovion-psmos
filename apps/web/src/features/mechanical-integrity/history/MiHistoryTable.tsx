'use client';

import { HistoryEventTypeBadge } from '../shared/HistoryEventTypeBadge';
import type { MiHistoryEvent } from '../types/mi-history.types';

type Props = {
  rows?: MiHistoryEvent[] | undefined;
  onSelect?: ((event: MiHistoryEvent) => void) | undefined;
};

export function MiHistoryTable({ rows = [], onSelect }: Props) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--psm-line)] bg-[var(--psm-surface)] p-8 text-center text-sm text-[var(--psm-muted)]">
        No mechanical integrity history events match the selected filters.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--psm-line)] text-sm">
          <thead className="bg-[var(--psm-muted-bg)] text-left text-xs uppercase tracking-[0.12em] text-[var(--psm-muted)]">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Record</th>
              <th className="px-4 py-3">Impact</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--psm-line)]">
            {rows.map((event) => (
              <tr key={event.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="font-semibold text-[var(--psm-text)]">{event.eventTitle}</div>
                  <div className="mt-1 max-w-sm text-xs text-[var(--psm-muted)]">{event.eventDescription ?? 'No description recorded.'}</div>
                </td>
                <td className="px-4 py-3">{event.sourceModule}</td>
                <td className="px-4 py-3">{event.sourceRecordNumber ?? event.sourceRecordId ?? 'None'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <HistoryEventTypeBadge type={event.eventType} />
                    {event.readinessImpact ? <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">Readiness</span> : null}
                    {event.startupImpact ? <span className="rounded-full bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-700 dark:text-rose-300">Startup</span> : null}
                  </div>
                </td>
                <td className="px-4 py-3">{event.actorUserId ?? 'System'}</td>
                <td className="px-4 py-3">{new Date(event.eventAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onSelect?.(event)} className="rounded-lg border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold">
                    View detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
