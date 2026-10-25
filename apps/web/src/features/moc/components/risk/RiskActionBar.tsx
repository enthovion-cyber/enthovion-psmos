'use client';

import { CheckCircle2, Lock, RefreshCcw, RotateCcw, Save, Unlock } from 'lucide-react';
import { MocButton } from '../moc-detail-ui';

export function RiskActionBar({
  readOnly,
  saving,
  recalculating,
  completing,
  locking,
  unlocking,
  onSave,
  onRecalculate,
  onComplete,
  onLock,
  onUnlock,
  onRequestReassessment,
  isLocked
}: {
  readOnly?: boolean;
  saving?: boolean;
  recalculating?: boolean;
  completing?: boolean;
  locking?: boolean;
  unlocking?: boolean;
  onSave: () => void;
  onRecalculate: () => void;
  onComplete: () => void;
  onLock: () => void;
  onUnlock: () => void;
  onRequestReassessment: () => void;
  isLocked?: boolean;
}) {
  return (
    <div className="sticky bottom-3 z-20 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)]/95 p-3 shadow-lg backdrop-blur transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--psm-muted)]">
          HAZOP Risk Governance Actions
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <MocButton
            variant="primary"
            onClick={onSave}
            disabled={readOnly || saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Risk'}
          </MocButton>
          <MocButton
            variant="secondary"
            onClick={onRecalculate}
            disabled={readOnly || recalculating}
          >
            <RefreshCcw className="h-4 w-4" />
            {recalculating ? 'Recalculating...' : 'Recalculate'}
          </MocButton>
          <MocButton
            variant="secondary"
            onClick={onComplete}
            disabled={readOnly || completing}
            className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete
          </MocButton>
          {isLocked ? (
            <MocButton variant="secondary" onClick={onUnlock} disabled={unlocking}>
              <Unlock className="h-4 w-4" />
              Unlock
            </MocButton>
          ) : (
            <MocButton variant="secondary" onClick={onLock} disabled={readOnly || locking}>
              <Lock className="h-4 w-4" />
              Lock
            </MocButton>
          )}
          <MocButton variant="danger" onClick={onRequestReassessment}>
            <RotateCcw className="h-4 w-4" />
            Request Reassessment
          </MocButton>
        </div>
      </div>
    </div>
  );
}
