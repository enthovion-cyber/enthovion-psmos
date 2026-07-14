import { Wrench } from 'lucide-react';
import type { LopaIplGap } from '../../types/lopa-ipls-safeguards.types';
import { LopaPanel } from '../overview/LopaOverviewShared';
import { EmptyState, IplBadge } from './LopaIplBadges';

export function IplGapsActionsPanel({ gaps, readOnly, creating, onCreateActions }: { gaps: LopaIplGap[]; readOnly: boolean; creating: boolean; onCreateActions: () => void }) {
  return (
    <LopaPanel title="IPL Gaps / Actions" action={<button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly || creating} onClick={onCreateActions}><Wrench size={14} />{creating ? 'Creating...' : 'Create Missing Data Actions'}</button>}>
      {!gaps.length ? <EmptyState text="No IPL validation gaps or blockers are currently open." /> : (
        <div className="space-y-2">
          {gaps.map((gap) => (
            <div key={gap.id} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-white">{gap.gap_title ?? gap.title}</div>
                <div className="flex gap-2"><IplBadge value={gap.severity} kind="risk" /><IplBadge value={gap.status} /></div>
              </div>
              <div className="mt-1 text-xs text-slate-500">{gap.gap_type}{gap.closure_blocker ? ' · Closure blocker' : ''}</div>
            </div>
          ))}
        </div>
      )}
    </LopaPanel>
  );
}
