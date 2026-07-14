import { Calculator, LockKeyhole, RefreshCw, ShieldCheck, UnlockKeyhole } from 'lucide-react';
import { SilStatus } from './SilPanel';

export function SilDeterminationHeader({ header, readOnly, busy, canDetermine, lockDisabledReason, onDetermine, onReassess, onLock, onUnlock }: { header: any; readOnly: boolean; busy: boolean; canDetermine: boolean; lockDisabledReason?: string; onDetermine: () => void; onReassess: () => void; onLock: () => void; onUnlock: () => void }) {
  return <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-cyan-300/10 dark:bg-[#071525]">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><ShieldCheck className="h-5 w-5 text-cyan-500"/><h2 className="text-base font-bold text-slate-900 dark:text-white">SIL Determination / SIF Specification</h2><SilStatus value={header.silStatus}/>{header.needsReassessment ? <SilStatus value="Needs Reassessment"/> : null}</div><p className="mt-1 truncate text-xs text-slate-500">{header.lopaNumber} · {header.title} · Risk gap {header.riskGapStatus ?? 'not evaluated'}</p></div>
      <div className="flex flex-wrap gap-2">
        <button className="lopa-button-primary" disabled={busy || readOnly || !canDetermine} title={!canDetermine ? 'Complete and calculate current Risk Calculation first.' : undefined} onClick={onDetermine}><Calculator size={14}/> Determine SIL</button>
        {header.needsReassessment ? <button className="lopa-button-secondary" disabled={busy || readOnly} onClick={onReassess}><RefreshCw size={14}/> Reassess</button> : null}
        {header.silStatus === 'Locked' ? <button className="lopa-button-secondary" disabled={busy} onClick={onUnlock}><UnlockKeyhole size={14}/> Unlock</button> : <button className="lopa-button-secondary" disabled={busy || readOnly || !!lockDisabledReason} title={lockDisabledReason} onClick={onLock}><LockKeyhole size={14}/> Lock Basis</button>}
      </div>
    </div>
  </section>;
}
