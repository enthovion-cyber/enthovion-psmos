import { LopaPanel, TonePill } from '../overview/LopaOverviewShared';

export function DependencyImpactPanel({ dependencies }: { dependencies: any[] }) {
  return (
    <LopaPanel title="Dependency / Impact Panel">
      <div className="space-y-2">
        {dependencies.map((item) => <div key={item.id ?? item.title} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm"><div className="flex justify-between"><b className="text-white">{item.title ?? item.recordTitle ?? 'Dependency'}</b><TonePill tone={item.blocking ? 'danger' : item.impactLevel === 'High' ? 'warning' : 'neutral'}>{item.impactLevel ?? item.status ?? 'Tracked'}</TonePill></div><p className="mt-1 text-slate-400">{item.reason ?? item.description ?? item.notes ?? 'Dependency is tracked by backend readiness rules.'}</p></div>)}
        {!dependencies.length ? <div className="text-sm text-slate-400">No active linked-record dependencies or impacts returned.</div> : null}
      </div>
    </LopaPanel>
  );
}
