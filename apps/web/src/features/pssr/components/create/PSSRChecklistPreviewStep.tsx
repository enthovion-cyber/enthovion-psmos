'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function PSSRChecklistPreviewStep({ items = [] }: { items?: any[] }) {
  return (
    <PSSRCard title="Required Checklist Preview">
      {items.length ? <div className="grid gap-3 lg:grid-cols-2">{items.map((item) => <div key={`${item.groupName}-${item.title}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-3"><div className="flex items-center justify-between gap-2"><p className="font-bold text-white">{item.title}</p><Badge tone={item.evidenceRequired ? 'amber' : 'blue'}>{item.groupName}</Badge></div><p className="mt-2 text-xs text-slate-400">Required before startup: {item.requiredBeforeStartup ? 'Yes' : 'No'} · Evidence: {item.evidenceRequired ? 'Required' : 'Optional'} · Verification: {item.verificationRequired ? 'Required' : 'Optional'} · Owner: {item.ownerRole}</p></div>)}</div> : <EmptyState title="Checklist preview will generate after MOC context or create" detail="Backend-generated checklist items are saved when the PSSR is created." />}
    </PSSRCard>
  );
}
