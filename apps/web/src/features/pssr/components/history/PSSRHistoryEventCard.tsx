'use client';
import { Badge } from '../pssr-ui';
export function PSSRHistoryEventCard({ event, onSelect }: { event: any; onSelect: (event: any) => void }) {
  return <button onClick={() => onSelect(event)} className="w-full rounded-xl border border-white/10 bg-slate-950/30 p-4 text-left hover:bg-white/[0.04]"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black text-white">{event.event_title}</p><p className="text-sm text-slate-400">{event.description}</p></div><div className="flex gap-2"><Badge tone={event.is_safety_critical ? 'red' : 'slate'}>{event.event_type}</Badge><Badge>{event.event_category}</Badge></div></div><p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">{event.created_at ? new Date(event.created_at).toLocaleString() : '-'} · {event.user_name ?? event.user_id ?? 'System'}</p></button>;
}
