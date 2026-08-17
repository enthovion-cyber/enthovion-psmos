import Link from 'next/link';
import { AuditBadge } from '../shared/AuditUi';
import type { AuditHistoryEvent } from '../types/audit-history.types';

export function AuditTimelineEventCard({ event }: { event: AuditHistoryEvent }) {
  const restricted = Boolean(event.restricted);
  return (
    <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2"><AuditBadge tone="info">{event.source_module}</AuditBadge><AuditBadge>{event.event_type}</AuditBadge>{restricted ? <AuditBadge tone="danger">Restricted</AuditBadge> : null}</div>
          <h3 className="mt-3 text-base font-semibold text-[var(--psm-fg)]">{event.event_title}</h3>
          <p className="mt-1 text-sm text-[var(--psm-muted)]">{event.event_description ?? 'No description recorded.'}</p>
        </div>
        <time className="text-xs font-semibold text-[var(--psm-muted)]">{new Date(event.occurred_at ?? event.created_at).toLocaleString()}</time>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--psm-muted)]">
        <span>{event.source_object_type}</span>
        <span>{restricted ? 'Source redacted' : event.source_record_id}</span>
        {event.criticality ? <span>Criticality: {event.criticality}</span> : null}
      </div>
      {!restricted ? <Link className="mt-3 inline-flex text-sm font-semibold text-primary" href={`/audit-compliance/history/activity?sourceRecordId=${event.source_record_id}`}>Open source trace</Link> : null}
    </article>
  );
}
