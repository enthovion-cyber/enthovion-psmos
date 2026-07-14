'use client';

import { Badge, EmptyState, PSSRCard, riskTone } from '../pssr-ui';

export function PSSRStartupBlockersPreviewStep({ items = [] }: { items?: any[] }) {
  return (
    <PSSRCard title="Startup Blockers Preview">
      {items.length ? <div className="space-y-3">{items.map((item, index) => <div key={`${item.blockerTitle}-${index}`} className="rounded-lg border border-red-300/15 bg-red-500/5 p-3"><div className="flex items-center justify-between gap-2"><p className="font-bold text-white">{item.blockerTitle}</p><Badge tone={riskTone(item.severity)}>{item.severity}</Badge></div><p className="mt-2 text-xs text-slate-400">{item.sourceModule} · {item.blockerDescription ?? item.resolutionRequirement ?? 'Resolution required before startup.'}</p></div>)}</div> : <EmptyState title="No startup blockers generated" detail="Linked MOC actions, missing documents, training, testing, and punch items will create blockers when required." />}
    </PSSRCard>
  );
}
