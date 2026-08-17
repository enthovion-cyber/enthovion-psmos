'use client';

import { BeforeAfterChangePanel } from './BeforeAfterChangePanel';
import { HistoryEventTypeBadge } from '../shared/HistoryEventTypeBadge';
import type { MiHistoryEvent } from '../types/mi-history.types';

export function HistoryEventDetailDrawer({ event, onClose }: { event: MiHistoryEvent | null; onClose: () => void }) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4">
      <aside className="ml-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-2xl">
        <div className="border-b border-[var(--psm-line)] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <HistoryEventTypeBadge type={event.eventType} />
              <h2 className="mt-3 text-xl font-semibold">{event.eventTitle}</h2>
              <p className="mt-1 text-sm text-[var(--psm-muted)]">{event.eventDescription ?? 'No event description recorded.'}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--psm-line)] px-3 py-1 text-sm">Close</button>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-auto p-5">
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['Module', event.sourceModule],
              ['Source record', event.sourceRecordNumber ?? event.sourceRecordId ?? 'None'],
              ['Actor', event.actorUserId ?? 'System'],
              ['Event time', new Date(event.eventAt).toLocaleString()],
              ['Audit log', event.auditLogId ?? 'Not linked'],
              ['Severity', event.severity]
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[var(--psm-line)] p-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--psm-muted)]">{label}</dt>
                <dd className="mt-1 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
          {event.beforeAfterAvailable ? <BeforeAfterChangePanel before={event.beforeValues} after={event.afterValues} /> : (
            <div className="rounded-xl border border-dashed border-[var(--psm-line)] p-5 text-sm text-[var(--psm-muted)]">No before/after diff is available for this event.</div>
          )}
        </div>
      </aside>
    </div>
  );
}
