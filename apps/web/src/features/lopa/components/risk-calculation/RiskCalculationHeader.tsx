import { Calculator, Download, Lock, Play, RefreshCw, Save, Unlock } from 'lucide-react';
import { CalculationStatusBadge } from '../shared/CalculationStatusBadge';

export function RiskCalculationHeader({ header, readOnly, calculating, onCalculate, onRecalculate, onSnapshot, onLock, onUnlock, onExport }: any) {
  const locked = !!header?.locked;
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black text-white">Risk Calculation</h2><CalculationStatusBadge value={header?.calculationStatus} />{locked ? <CalculationStatusBadge value="Locked" /> : null}</div>
          <p className="mt-1 text-sm text-slate-400">Backend-calculated LOPA frequency, credited IPL reduction, risk gap, and SIL trigger using approved current inputs only.</p>
          <div className="mt-2 text-xs text-slate-500">Last calculated: {header?.lastCalculatedAt ? new Date(header.lastCalculatedAt).toLocaleString() : 'Not calculated'}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="lopa-button-primary disabled:opacity-50" disabled={readOnly || calculating || locked} onClick={onCalculate}><Play size={15} />{calculating ? 'Calculating...' : 'Calculate'}</button>
          <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly || calculating || locked} onClick={onRecalculate}><RefreshCw size={15} />Recalculate</button>
          <button className="lopa-button-secondary disabled:opacity-50" disabled={!header?.lastCalculatedAt} onClick={onSnapshot}><Save size={15} />Save Snapshot</button>
          {locked ? <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly} onClick={onUnlock}><Unlock size={15} />Unlock</button> : <button className="lopa-button-secondary disabled:opacity-50" disabled={readOnly || !header?.lastCalculatedAt} onClick={onLock}><Lock size={15} />Lock</button>}
          <button className="lopa-button-secondary" onClick={onExport}><Download size={15} />Export</button>
        </div>
      </div>
    </div>
  );
}
