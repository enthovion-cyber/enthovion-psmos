'use client';

import { ShieldAlert } from 'lucide-react';
import { Badge, MocButton, statusTone } from '../moc-detail-ui';
import { MOCBeforeAfterViewer } from './MOCBeforeAfterViewer';

export function MOCHistoryEventCard({ event, onOpen }: { event: any; onOpen: (event: any) => void }) {
  return (
    <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 transition-all hover:border-primary/50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[var(--psm-fg)]">{event.event_title ?? event.title ?? event.event_type}</p>
            <Badge tone={statusTone(event.event_category)}>{event.event_category ?? event.event_type ?? 'Event'}</Badge>
            {event.is_safety_critical ? <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400"><ShieldAlert className="h-3.5 w-3.5" /> Safety critical</span> : null}
          </div>
          <p className="mt-1 text-sm text-[var(--psm-fg)]">{event.description}</p>
          <p className="mt-2 text-xs text-[var(--psm-muted)]">{event.user_name ?? event.actor_name ?? 'System'} · {event.user_role ?? event.actor_role ?? 'System'} · {event.related_record_number ?? event.related_record_id ?? 'MOC'}</p>
        </div>
        <MocButton variant="outline" onClick={() => onOpen(event)}>View Details</MocButton>
      </div>
      <div className="mt-4">
        <MOCBeforeAfterViewer beforeValue={event.before_value} afterValue={event.after_value} />
      </div>
      <p className="mt-3 text-right text-xs text-[var(--psm-muted)]">{event.created_at ? new Date(event.created_at).toLocaleString() : '-'}</p>
    </article>
  );
}
