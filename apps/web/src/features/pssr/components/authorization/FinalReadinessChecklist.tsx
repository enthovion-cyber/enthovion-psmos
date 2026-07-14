'use client';
import { Badge, PSSRCard } from '../pssr-ui';
export function FinalReadinessChecklist({ checklist }: { checklist: any[] }) {
  const tone = (status: string) => status === 'Green' ? 'green' : status === 'Amber' ? 'amber' : status === 'Gray' ? 'slate' : 'red';
  return <PSSRCard title="Final Readiness Checklist"><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{checklist.map((item) => <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/30 p-3"><div><p className="font-bold text-white">{item.label}</p><p className="text-xs text-slate-500">{item.percent ?? 0}% ready</p></div><Badge tone={tone(item.status) as any}>{item.status}</Badge></div>)}</div></PSSRCard>;
}
