'use client';

import { X } from 'lucide-react';
import { Badge, statusTone } from '../moc-detail-ui';
import { MOCBeforeAfterViewer } from './MOCBeforeAfterViewer';

export function MOCEventDetailDrawer({ event, onClose }: { event: any; onClose: () => void }) {
  if (!event) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-cyan-300/15 bg-[#07182a] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Event Detail</p>
            <h2 className="mt-1 text-xl font-black text-white">{event.event_title ?? event.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2"><Badge tone={statusTone(event.event_category)}>{event.event_category ?? event.event_type}</Badge>{event.is_safety_critical ? <Badge tone="red">Safety Critical</Badge> : null}</div>
          </div>
          <button className="rounded-md border border-white/10 p-2 text-slate-200 hover:bg-white/10" onClick={onClose} aria-label="Close history detail"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-300">{event.description}</p>
        <dl className="mt-5 grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm md:grid-cols-2">
          <Info label="User" value={event.user_name ?? event.actor_name ?? 'System'} />
          <Info label="Role" value={event.user_role ?? event.actor_role ?? '-'} />
          <Info label="Related Record" value={event.related_record_number ?? event.related_record_id ?? '-'} />
          <Info label="Event Time" value={event.created_at ? new Date(event.created_at).toLocaleString() : '-'} />
          <Info label="IP Address" value={event.ip_address ?? '-'} />
          <Info label="User Agent" value={event.user_agent ?? '-'} />
        </dl>
        <div className="mt-5"><MOCBeforeAfterViewer beforeValue={event.before_value} afterValue={event.after_value} /></div>
        <pre className="mt-5 max-h-80 overflow-auto rounded-xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-400">{JSON.stringify(event.metadata ?? {}, null, 2)}</pre>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return <div><dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-bold text-slate-100">{value}</dd></div>;
}
