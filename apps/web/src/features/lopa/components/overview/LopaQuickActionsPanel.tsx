import { ArrowRight, Lock } from 'lucide-react';
import type { LopaQuickAction } from '../../types/lopa-overview.types';
import { LopaPanel } from './LopaOverviewShared';

export function LopaQuickActionsPanel({ actions, onAction }: { actions: LopaQuickAction[]; onAction?: (action: LopaQuickAction) => void }) {
  return (
    <LopaPanel title="Quick Actions Panel">
      <div className="space-y-2">
        {actions.map((action) => (
          <button key={action.key} disabled={!action.enabled} title={!action.enabled ? action.reason : undefined} onClick={() => onAction?.(action)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2 text-left text-sm font-semibold text-slate-100 transition hover:border-blue-400/30 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50">
            <span>{action.label}</span>
            {action.enabled ? <ArrowRight size={14} /> : <Lock size={14} />}
          </button>
        ))}
      </div>
    </LopaPanel>
  );
}
