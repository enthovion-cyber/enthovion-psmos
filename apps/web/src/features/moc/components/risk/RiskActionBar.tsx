'use client';

import { CheckCircle2, Lock, RefreshCcw, RotateCcw, Save, Unlock } from 'lucide-react';

export function RiskActionBar({ readOnly, saving, recalculating, completing, locking, unlocking, onSave, onRecalculate, onComplete, onLock, onUnlock, onRequestReassessment, isLocked }: { readOnly?: boolean; saving?: boolean; recalculating?: boolean; completing?: boolean; locking?: boolean; unlocking?: boolean; onSave: () => void; onRecalculate: () => void; onComplete: () => void; onLock: () => void; onUnlock: () => void; onRequestReassessment: () => void; isLocked?: boolean }) {
  return (
    <div className="sticky bottom-3 z-20 rounded-xl border border-cyan-300/15 bg-[#061426]/95 p-3 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Risk ranking controls</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onSave} disabled={readOnly || saving} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Risk'}</button>
          <button type="button" onClick={onRecalculate} disabled={readOnly || recalculating} className="inline-flex items-center gap-2 rounded-md border border-blue-300/20 px-3 py-2 text-xs font-black text-blue-200 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCcw className="h-4 w-4" />{recalculating ? 'Recalculating...' : 'Recalculate'}</button>
          <button type="button" onClick={onComplete} disabled={readOnly || completing} className="inline-flex items-center gap-2 rounded-md border border-emerald-300/20 px-3 py-2 text-xs font-black text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Complete</button>
          {isLocked ? <button type="button" onClick={onUnlock} disabled={unlocking} className="inline-flex items-center gap-2 rounded-md border border-amber-300/20 px-3 py-2 text-xs font-black text-amber-200 disabled:opacity-50"><Unlock className="h-4 w-4" />Unlock</button> : <button type="button" onClick={onLock} disabled={readOnly || locking} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs font-black text-slate-200 disabled:opacity-50"><Lock className="h-4 w-4" />Lock</button>}
          <button type="button" onClick={onRequestReassessment} className="inline-flex items-center gap-2 rounded-md border border-red-300/20 px-3 py-2 text-xs font-black text-red-200"><RotateCcw className="h-4 w-4" />Request Reassessment</button>
        </div>
      </div>
    </div>
  );
}
