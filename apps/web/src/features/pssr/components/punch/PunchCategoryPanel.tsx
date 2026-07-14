'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function PunchCategoryPanel({ title, items, tone }: { title: string; items: any[]; tone: any }) {
  return <PSSRCard title={title}>{items.length ? <div className="space-y-2">{items.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><div className="flex items-center justify-between"><p className="font-bold text-white">{item.punch_number} · {item.title}</p><Badge tone={tone}>{item.status}</Badge></div><p className="mt-1 text-sm text-slate-400">{item.description}</p><p className="mt-2 text-xs text-slate-500">Owner {item.owner_id ?? '-'} · Due {item.due_date ?? '-'} · {item.source_module}</p></div>)}</div> : <EmptyState title="No open items" />}</PSSRCard>;
}
