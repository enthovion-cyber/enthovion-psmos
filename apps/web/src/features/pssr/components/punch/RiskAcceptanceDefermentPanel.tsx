'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function RiskAcceptanceDefermentPanel({ deferrals }: { deferrals: any[] }) {
  return <PSSRCard title="Risk Acceptance / Deferment Panel">{deferrals.length ? <div className="space-y-2">{deferrals.map((item) => <div key={item.id} className="rounded-lg border border-amber-300/15 bg-amber-500/10 p-3"><div className="flex items-center justify-between"><p className="font-bold text-white">{item.justification}</p><Badge tone={item.status === 'Approved' ? 'green' : 'amber'}>{item.status}</Badge></div><p className="mt-1 text-sm text-slate-400">{item.risk_assessment}</p><p className="mt-2 text-xs text-slate-500">Due after startup {item.due_date_after_startup} · Approved by {item.approved_by ?? '-'}</p></div>)}</div> : <EmptyState title="No deferred punch items" detail="Category B risk acceptance and deferment approvals appear here." />}</PSSRCard>;
}
