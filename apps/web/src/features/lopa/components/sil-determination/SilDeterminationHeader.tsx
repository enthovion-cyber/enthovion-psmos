import { Calculator, LockKeyhole, RefreshCw, ShieldCheck, UnlockKeyhole, Zap } from 'lucide-react';
import { SilStatus } from './SilPanel';

export function SilDeterminationHeader({
  header,
  readOnly,
  busy,
  canDetermine,
  lockDisabledReason,
  onDetermine,
  onReassess,
  onLock,
  onUnlock,
  onSyncToEquipmentAndMi,
}: {
  header: any;
  readOnly: boolean;
  busy: boolean;
  canDetermine: boolean;
  lockDisabledReason?: string | undefined;
  onDetermine: () => void;
  onReassess: () => void;
  onLock: () => void;
  onUnlock: () => void;
  onSyncToEquipmentAndMi?: (() => void) | undefined;
}) {
  return (
    <section className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">SIL Determination / SIF Specification</h2>
            <SilStatus value={header.silStatus} />
            {header.needsReassessment ? <SilStatus value="Needs Reassessment" /> : null}
          </div>
          <p className="mt-1 truncate text-xs text-[var(--psm-muted)]">
            {header.lopaNumber} · {header.title} · Risk gap: <span className="font-semibold text-slate-200">{header.riskGapStatus ?? 'Not evaluated'}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onSyncToEquipmentAndMi ? (
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
              disabled={busy}
              onClick={onSyncToEquipmentAndMi}
              title="Promote tagged equipment to Safety Critical in Equipment Registry and sync SIF proof-test intervals to Mechanical Integrity"
            >
              <Zap size={14} className="text-amber-400" />
              Sync to Equipment & MI
            </button>
          ) : null}
          <button
            type="button"
            className="lopa-button-primary flex items-center gap-1.5"
            disabled={busy || readOnly || !canDetermine}
            title={!canDetermine ? 'Complete and calculate current Risk Calculation first.' : undefined}
            onClick={onDetermine}
          >
            <Calculator size={14} /> Determine SIL
          </button>
          {header.needsReassessment ? (
            <button type="button" className="lopa-button-secondary flex items-center gap-1.5" disabled={busy || readOnly} onClick={onReassess}>
              <RefreshCw size={14} /> Reassess
            </button>
          ) : null}
          {header.silStatus === 'Locked' ? (
            <button type="button" className="lopa-button-secondary flex items-center gap-1.5" disabled={busy} onClick={onUnlock}>
              <UnlockKeyhole size={14} /> Unlock
            </button>
          ) : (
            <button
              type="button"
              className="lopa-button-secondary flex items-center gap-1.5"
              disabled={busy || readOnly || !!lockDisabledReason}
              title={lockDisabledReason}
              onClick={onLock}
            >
              <LockKeyhole size={14} /> Lock Basis
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
