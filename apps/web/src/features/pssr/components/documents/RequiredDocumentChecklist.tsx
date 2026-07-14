'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function RequiredDocumentChecklist({ requirements }: { requirements: any[] }) {
  return <PSSRCard title="Required Document Checklist">{requirements.length ? <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{requirements.map((item) => <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-black text-white">{item.document_type}</p><p className="text-sm text-slate-400">{item.document_title}</p><p className="mt-1 text-xs text-slate-500">{item.source}</p></div><Badge tone={item.required_before_startup ? 'red' : 'amber'}>{item.required_before_startup ? 'Startup Required' : 'Required'}</Badge></div></div>)}</div> : <EmptyState title="No document readiness requirements generated yet." />}</PSSRCard>;
}
