import { LopaPanel, ProgressBar, TonePill } from '../overview/LopaOverviewShared';

export function RiskCalculationReadinessPanel({ readiness }: { readiness: any }) {
  const checks = readiness?.checks ?? [];
  const blockers = readiness?.blockers ?? [];
  return (
    <LopaPanel title="Backend Readiness / Blockers">
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm"><span className="font-bold text-white">{readiness?.status ?? 'Not evaluated'}</span><span className="text-slate-400">{readiness?.percent ?? 0}%</span></div>
          <ProgressBar value={readiness?.percent ?? 0} tone={blockers.length ? 'danger' : 'success'} />
        </div>
        <div className="grid gap-2">
          {checks.length ? checks.map((check: any) => <div key={check.key ?? check.title} className="flex items-center justify-between rounded-lg border border-cyan-300/10 bg-[#03101d] p-2 text-sm"><span className="text-slate-200">{check.title}</span><TonePill tone={check.status === 'Complete' ? 'success' : check.status === 'Warning' ? 'warning' : 'danger'}>{check.status}</TonePill></div>) : <div className="text-sm text-slate-400">No readiness checks returned.</div>}
        </div>
      </div>
    </LopaPanel>
  );
}
