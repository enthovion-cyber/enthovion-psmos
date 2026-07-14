'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function BriefingAcknowledgementTracker({ acknowledgements, briefings, onAcknowledge }: { acknowledgements: any[]; briefings: any[]; onAcknowledge: (id: string) => void }) {
  return <PSSRCard title="Briefing / Acknowledgement Tracker"><div className="grid gap-3 lg:grid-cols-2"><div className="space-y-2">{acknowledgements.length ? acknowledgements.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/30 p-3"><div><p className="font-bold text-white">{item.acknowledgement_type}</p><p className="text-xs text-slate-500">{item.acknowledged_at ?? item.waived_at ?? 'Pending acknowledgement'}</p></div><button onClick={() => onAcknowledge(item.id)} className="rounded-md border border-blue-300/20 px-2 py-1 text-xs font-bold text-blue-200">{item.status}</button></div>) : <EmptyState title="No acknowledgements required" />}</div><div className="space-y-2">{briefings.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><div className="flex items-center justify-between"><p className="font-bold text-white">{item.title}</p><Badge>{item.status}</Badge></div><p className="mt-1 text-xs text-slate-500">{item.briefing_type} · {item.attendees_count ?? 0} attendees</p></div>)}</div></div></PSSRCard>;
}
