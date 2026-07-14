'use client';

import { Download, Plus, RefreshCw, ShieldCheck } from 'lucide-react';

export function IplRegistryHeader({ onNew, onRefresh, onExport }: { onNew: () => void; onRefresh: () => void; onExport: () => void }) {
  return (
    <header className="rounded-xl border border-cyan-300/10 bg-[#071525] p-4 shadow-xl shadow-black/10">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-300"><ShieldCheck size={14} /> LOPA / SIL Management</div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white">IPL Registry</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">Governed independent protection layer definitions, PFD/RRF basis, validation criteria, proof test requirements, evidence links, approvals, and revisions. Registry records are candidates only until validated in a specific study.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onRefresh} className="lopa-button-secondary"><RefreshCw size={14} /> Refresh</button>
          <button onClick={onExport} className="lopa-button-secondary"><Download size={14} /> Export</button>
          <button onClick={onNew} className="lopa-button-primary"><Plus size={14} /> New IPL</button>
        </div>
      </div>
    </header>
  );
}
