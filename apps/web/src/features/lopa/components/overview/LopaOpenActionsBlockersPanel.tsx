import { AlertTriangle } from 'lucide-react';
import type { LopaBlocker } from '../../types/lopa-overview.types';
import { LopaPanel, TonePill } from './LopaOverviewShared';

export function LopaOpenActionsBlockersPanel({ actions, blockers }: { actions: any[]; blockers: LopaBlocker[] }) {
  return (
    <LopaPanel title="Open Actions & Blockers Panel">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Closure blockers</div>
          <div className="space-y-2">
            {blockers.length ? blockers.map((blocker) => (
              <div key={blocker.id} className="rounded-lg border border-red-400/20 bg-red-500/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-red-100"><AlertTriangle size={14} /> {blocker.title}</div>
                  <TonePill tone={blocker.severity === 'Hard' ? 'danger' : 'warning'}>{blocker.severity}</TonePill>
                </div>
                <div className="mt-1 text-xs text-red-100/75">{blocker.description}</div>
              </div>
            )) : <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">No closure blockers returned by backend.</div>}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Universal actions</div>
          <div className="space-y-2">
            {actions.length ? actions.map((action) => (
              <div key={action.id} className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-slate-100">{action.title}</div>
                  <TonePill tone={action.status === 'Closed' ? 'success' : 'warning'}>{action.status}</TonePill>
                </div>
                <div className="mt-1 text-xs text-slate-500">{[action.priority, action.dueDate].filter(Boolean).join(' - ') || 'No priority/due date'}</div>
              </div>
            )) : <div className="rounded-lg border border-cyan-300/10 bg-[#03101d] p-3 text-sm text-slate-400">No Universal Actions linked to this LOPA study.</div>}
          </div>
        </div>
      </div>
    </LopaPanel>
  );
}
