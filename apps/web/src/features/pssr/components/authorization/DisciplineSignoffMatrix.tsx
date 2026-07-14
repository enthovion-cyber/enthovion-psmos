'use client';

import { Badge, EmptyState, PSSRCard, ProgressBar } from '../pssr-ui';

export function DisciplineSignoffMatrix({ data, onGenerate, busy }: { data?: any; onGenerate?: () => void; busy?: boolean }) {
  const signoffs = data?.signoffs ?? [];
  const items = data?.items ?? [];
  return (
    <PSSRCard title="Discipline Sign-Off Matrix" action={<button disabled={busy} onClick={onGenerate} className="rounded-md border border-cyan-300/15 px-3 py-1.5 text-xs font-black text-slate-200 hover:border-blue-300/40">Generate</button>}>
      {signoffs.length ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {signoffs.map((signoff: any) => {
            const checklist = items.filter((item: any) => item.signoff_id === signoff.id);
            return (
              <div key={signoff.id} className="rounded-lg border border-cyan-300/10 bg-slate-950/30 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-white">{signoff.discipline}</p>
                    <p className="mt-1 text-xs text-slate-500">{signoff.blocking_items_count} blockers · {checklist.length} checklist items</p>
                  </div>
                  <Badge tone={signoff.status === 'Signed' ? 'green' : signoff.status === 'Rejected' ? 'red' : 'amber'}>{signoff.status}</Badge>
                </div>
                <div className="mt-3"><ProgressBar value={signoff.checklist_completion_percent ?? 0} tone={signoff.blocking_items_count ? 'red' : signoff.checklist_completion_percent >= 100 ? 'green' : 'blue'} /></div>
                <div className="mt-3 max-h-28 space-y-1 overflow-auto text-xs text-slate-400">
                  {checklist.map((item: any) => <div key={item.id} className="flex justify-between gap-2 border-t border-white/5 pt-1"><span>{item.item_title}</span><span>{item.status}</span></div>)}
                </div>
                <p className="mt-3 rounded-md border border-blue-300/10 bg-blue-500/5 px-3 py-2 text-xs font-bold text-blue-100">Signing is handled by the Universal E-Signature matrix below.</p>
              </div>
            );
          })}
        </div>
      ) : <EmptyState title="No discipline signoffs generated" detail="Generate discipline-specific checklist and signatures for engineering, operations, maintenance, I&E, HSE, and Plant Manager final authorization." />}
    </PSSRCard>
  );
}
