'use client';

import Link from 'next/link';
import { Download, FileSearch, Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import { PSSRCard } from '../pssr-ui';

export function PSSRQuickActions({ onRefresh, onExport, onFilter }: { onRefresh: () => void; onExport: () => void; onFilter: (filter: Record<string, any>) => void }) {
  return (
    <PSSRCard title="Quick Actions">
      <div className="grid gap-2">
        <Link href="/pssr/new" className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 px-3 text-sm font-bold text-slate-100 transition hover:border-blue-300/40 hover:bg-blue-500/10"><Plus size={15} /> Create New PSSR</Link>
        <button onClick={onRefresh} className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 px-3 text-sm font-bold text-slate-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/10"><RefreshCw size={15} /> Refresh Dashboard</button>
        <button onClick={onExport} className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 px-3 text-sm font-bold text-slate-100 transition hover:border-amber-300/40 hover:bg-amber-500/10"><Download size={15} /> Export PSSR Register</button>
        <button onClick={() => onFilter({ quick: 'ready' })} className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 px-3 text-sm font-bold text-slate-100 transition hover:border-blue-300/40 hover:bg-blue-500/10"><FileSearch size={15} /> Ready For Authorization</button>
        <button onClick={() => onFilter({ quick: 'blocked' })} className="inline-flex h-10 items-center gap-2 rounded-md border border-red-300/20 px-3 text-sm font-bold text-red-100 transition hover:bg-red-500/10"><ShieldAlert size={15} /> Startup Blocked</button>
      </div>
    </PSSRCard>
  );
}
