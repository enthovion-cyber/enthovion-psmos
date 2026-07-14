'use client';
import { Badge, EmptyState, PSSRCard } from '../pssr-ui';
export function PSSREventDetailDrawer({ event }: { event?: any }) {
  return <PSSRCard title="Event Detail Drawer">{event ? <div className="space-y-3"><div><p className="text-xl font-black text-white">{event.event_title}</p><p className="text-sm text-slate-400">{event.description}</p></div><div className="flex flex-wrap gap-2"><Badge>{event.event_category}</Badge><Badge>{event.event_type}</Badge>{event.is_safety_critical ? <Badge tone="red">Safety Critical</Badge> : null}</div><p className="text-xs text-slate-500">{event.created_at ? new Date(event.created_at).toLocaleString() : '-'} · {event.user_name ?? event.user_id ?? 'System'}</p></div> : <EmptyState title="Select a history event" />}</PSSRCard>;
}
