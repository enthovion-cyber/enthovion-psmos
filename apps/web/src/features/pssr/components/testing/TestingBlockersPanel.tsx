'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function TestingBlockersPanel({ blockers }: { blockers: any[] }) {
  return <PSSRCard title="Testing Blockers">{blockers.length ? <div className="space-y-2">{blockers.map((item) => <div key={item.id} className="rounded-lg border border-red-300/15 bg-red-500/10 p-3"><div className="flex items-center justify-between"><p className="font-bold text-white">{item.title}</p><Badge tone={item.severity === 'High' ? 'red' : 'amber'}>{item.severity}</Badge></div><p className="text-sm text-slate-400">{item.description}</p></div>)}</div> : <EmptyState title="No testing blockers" detail="Required tests, acceptance criteria, evidence, and verification are clear." />}</PSSRCard>;
}
