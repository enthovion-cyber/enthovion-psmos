'use client';

import type { AuthSecurityEvent } from '../types/security-event.types';

export function SecurityEventTimeline({ events }: { events: AuthSecurityEvent[] }) {
  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div key={event.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm">
          <div className="font-semibold">{event.eventType ?? event.event_type ?? 'Security event'}</div>
          <div className="text-xs text-[var(--psm-muted)]">{event.createdAt ?? event.created_at ?? ''}</div>
          {event.failure_reason ? <div className="mt-1 text-xs text-warning">{event.failure_reason}</div> : null}
        </div>
      ))}
      {!events.length ? <div className="text-sm text-[var(--psm-muted)]">No security events found.</div> : null}
    </div>
  );
}
