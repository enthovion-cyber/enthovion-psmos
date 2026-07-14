import { ProgressBar, LopaPanel, TonePill } from './LopaOverviewShared';
import type { LopaOverview } from '../../types/lopa-overview.types';

export function LopaReadinessPanel({ readiness }: { readiness: LopaOverview['readiness'] }) {
  const percent = readiness.total ? Math.round((readiness.complete / readiness.total) * 100) : 0;
  return (
    <LopaPanel title="Readiness / Missing Data Panel" action={<TonePill tone={readiness.status === 'Ready' ? 'success' : 'warning'}>{readiness.status}</TonePill>}>
      <div className="mb-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-white">{percent}%</div>
            <div className="text-xs text-slate-500">Overall readiness</div>
          </div>
          <div className="text-right text-xs text-slate-400">{readiness.complete} / {readiness.total} complete</div>
        </div>
        <div className="mt-3"><ProgressBar value={percent} tone={readiness.status === 'Ready' ? 'success' : readiness.blocked ? 'danger' : 'warning'} /></div>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {readiness.checklist.map((check) => (
          <div key={check.key} className="flex items-center justify-between gap-3 rounded-lg border border-cyan-300/10 bg-[#03101d] p-3">
            <span className="text-xs text-slate-300">{check.label}</span>
            <TonePill tone={check.status === 'Complete' ? 'success' : check.status === 'Blocked' ? 'danger' : 'warning'}>{check.status}</TonePill>
          </div>
        ))}
      </div>
    </LopaPanel>
  );
}
