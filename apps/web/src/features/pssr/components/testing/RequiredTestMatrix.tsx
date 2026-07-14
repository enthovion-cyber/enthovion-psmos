'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function RequiredTestMatrix({ requirements }: { requirements: any[] }) {
  return <PSSRCard title="Required Test Matrix">{requirements.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{requirements.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><div className="flex items-center justify-between"><p className="font-black text-white">{item.test_title}</p><Badge tone={item.startup_blocking ? 'red' : 'blue'}>{item.test_category}</Badge></div><p className="mt-2 text-sm text-slate-400">{item.acceptance_criteria ?? item.description}</p><p className="mt-2 text-xs text-slate-500">{item.source} · Due {item.due_date ?? '-'}</p></div>)}</div> : <EmptyState title="No testing or commissioning requirements generated yet." />}</PSSRCard>;
}
