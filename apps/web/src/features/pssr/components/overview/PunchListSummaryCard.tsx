'use client';

import { Badge, EmptyState, PSSRCard } from '../pssr-ui';

export function PunchListSummaryCard({ pssr }: { pssr: any }) {
  const blockers = pssr.blockers ?? [];
  return (
    <PSSRCard title="Startup Blockers / Punch List">
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Counter label="Critical" value={pssr.summary?.categoryAOpen ?? 0} tone="red" />
        <Counter label="High" value={pssr.summary?.categoryBOpen ?? 0} tone="amber" />
        <Counter label="Medium" value={pssr.summary?.categoryCOpen ?? 0} tone="blue" />
      </div>
      {blockers.length ? (
        <div className="space-y-2">
          {blockers.slice(0, 5).map((item: any) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-slate-950/30 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-white">{item.blocker_title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.blocker_description}</p>
                </div>
                <Badge tone={item.severity === 'Critical' ? 'red' : item.severity === 'High' ? 'amber' : 'blue'}>{item.severity}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                <span>{item.source_module}</span>
                <span>{item.status}</span>
                {item.blocking ? <span className="text-red-300">Startup blocking</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No open startup blockers" detail="PSSR blockers generated from linked MOC actions, checklist requirements, and readiness gates will appear here." />
      )}
    </PSSRCard>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone: any }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center"><p className="text-2xl font-black text-white">{value}</p><Badge tone={tone}>{label}</Badge></div>;
}
