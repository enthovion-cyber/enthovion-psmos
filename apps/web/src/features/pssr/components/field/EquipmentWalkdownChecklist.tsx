'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function EquipmentWalkdownChecklist({ checklist, onUpdate }: { checklist: any[]; onUpdate: (item: any, status: string) => void }) {
  return (
    <PSSRCard title="Equipment Walkdown Checklist">
      {checklist.length ? <div className="grid gap-2 md:grid-cols-2">{checklist.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-white">{item.title}</p><p className="text-xs text-slate-500">{item.description}</p></div><Badge tone={item.status === 'Pass' ? 'green' : item.status === 'Fail' ? 'red' : 'amber'}>{item.status}</Badge></div><div className="mt-3 flex flex-wrap gap-2">{['Pass', 'Fail', 'Not Applicable', 'Needs Action'].map((status) => <button key={status} onClick={() => onUpdate(item, status)} className="rounded-md border border-white/10 px-2 py-1 text-xs font-bold text-slate-200 hover:bg-white/[0.06]">{status}</button>)}</div></div>)}</div> : <EmptyState title="No field checklist generated" detail="Generate field verification records from affected equipment." />}
    </PSSRCard>
  );
}
