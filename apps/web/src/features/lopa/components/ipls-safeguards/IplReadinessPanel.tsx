import type { LopaIplsSafeguardsReadiness } from '../../types/lopa-ipls-safeguards.types';
import { LopaPanel, ProgressBar } from '../overview/LopaOverviewShared';
import { IplBadge } from './LopaIplBadges';

export function IplReadinessPanel({ readiness }: { readiness: LopaIplsSafeguardsReadiness }) {
  return (
    <LopaPanel title="Backend Readiness / Calculation Preparation">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <IplBadge value={readiness.status} />
          <div className="mt-2 text-xs text-slate-500">Calculated by backend validation rules.</div>
        </div>
        <div className="text-right text-2xl font-black text-white">{readiness.completionPercent ?? 0}%</div>
      </div>
      <ProgressBar value={readiness.completionPercent ?? 0} tone={readiness.status === 'Ready' ? 'success' : readiness.status === 'Blocked' ? 'danger' : 'warning'} />
      <div className="mt-4 space-y-2">
        {readiness.checklist?.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm">
            <span className="text-slate-200">{item.label}</span>
            <IplBadge value={item.complete ? 'Complete' : item.status} />
          </div>
        ))}
      </div>
    </LopaPanel>
  );
}
