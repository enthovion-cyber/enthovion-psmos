'use client';

import { ShieldAlert } from 'lucide-react';
import { Badge, statusTone } from '../moc-detail-ui';
import { MOCBeforeAfterViewer } from './MOCBeforeAfterViewer';

export function MOCHistoryEventCard({ event, onOpen }: { event: any; onOpen: (event: any) => void }) {
  return (
    <article className="rounded-xl border border-cyan-300/10 bg-white/[0.03] p-4 hover:border-blue-300/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-white">{event.event_title ?? event.title ?? event.event_type}</p>
            <Badge tone={statusTone(event.event_category)}>{event.event_category ?? event.event_type ?? 'Event'}</Badge>
            {event.is_safety_critical ? <span className="inline-flex items-center gap-1 text-xs font-bold text-red-200"><ShieldAlert className="h-3 w-3" /> Safety critical</span> : null}
          </div>
          <p className="mt-1 text-sm text-slate-400">{event.description}</p>
          <p className="mt-2 text-xs text-slate-500">{event.user_name ?? event.actor_name ?? 'System'} · {event.user_role ?? event.actor_role ?? 'System'} · {event.related_record_number ?? event.related_record_id ?? 'MOC'}</p>
        </div>
        <button className="rounded-md border border-cyan-300/15 px-3 py-2 text-xs font-black text-slate-100 hover:bg-blue-500/10" onClick={() => onOpen(event)}>View Details</button>
      </div>
      <div className="mt-4">
        <MOCBeforeAfterViewer beforeValue={event.before_value} afterValue={event.after_value} />
      </div>
      <p className="mt-3 text-right text-xs text-slate-500">{event.created_at ? new Date(event.created_at).toLocaleString() : '-'}</p>
    </article>
  );
}
