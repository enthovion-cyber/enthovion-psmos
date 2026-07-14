'use client';

import { FileDown, Plus, RefreshCw, Search, ShieldPlus } from 'lucide-react';
import Link from 'next/link';

export function LopaDashboardHeader({ lastUpdated, search, onSearch, onRefresh }: { lastUpdated?: string | undefined; search: string; onSearch: (value: string) => void; onRefresh: () => void }) {
  return (
    <header className="rounded-xl border border-cyan-300/10 bg-[#071525] p-5 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Process Safety Management</p>
          <h1 className="mt-2 text-2xl font-bold text-white">LOPA / SIL Management</h1>
          <p className="mt-1 text-sm text-slate-400">Layer of Protection Analysis and SIL requirement tracking</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Not loaded'}</span>
          <button onClick={onRefresh} className="lopa-button-secondary"><RefreshCw size={15} /> Refresh</button>
          <Link href="/lopa/new" className="lopa-button-primary"><Plus size={15} /> New LOPA Study</Link>
          <Link href="/lopa/new?source=hazop" className="lopa-button-secondary"><ShieldPlus size={15} /> Create from HAZOP Scenario</Link>
          <button className="lopa-button-secondary"><FileDown size={15} /> Export Register</button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-cyan-300/10 bg-[#03101d] px-3 py-2">
        <Search size={16} className="text-slate-500" />
        <input value={search} onChange={(event) => onSearch(event.target.value)} className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500" placeholder="Search LOPA number, title, HAZOP, node, deviation, equipment, owner..." />
      </div>
    </header>
  );
}
