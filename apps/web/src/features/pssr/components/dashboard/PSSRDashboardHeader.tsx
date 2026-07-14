'use client';

import Link from 'next/link';
import { Download, Plus, RefreshCw } from 'lucide-react';

export function PSSRDashboardHeader({ generatedAt, onRefresh, onExport, refreshing }: { generatedAt?: string; onRefresh: () => void; onExport: () => void; refreshing?: boolean }) {
  return (
    <header className="rounded-xl border border-cyan-300/10 bg-[#07182a]/95 p-5 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Module 05 · Dashboard / Register</p>
          <h1 className="mt-1 text-3xl font-black text-white">Pre-Startup Safety Review</h1>
          <p className="mt-2 text-sm text-slate-400">Monitor startup readiness, blockers, punch health, authorization queues, linked MOCs, and live PSSR register records.</p>
          <p className="mt-2 text-xs font-bold text-slate-500">Active site scope · Current role permissions · Last refreshed {generatedAt ? new Date(generatedAt).toLocaleString() : '-'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onRefresh} className="inline-flex h-11 items-center gap-2 rounded-md border border-cyan-300/15 px-4 text-sm font-black text-slate-100 transition hover:border-blue-300/40 hover:bg-blue-500/10">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={onExport} className="inline-flex h-11 items-center gap-2 rounded-md border border-cyan-300/15 px-4 text-sm font-black text-slate-100 transition hover:border-emerald-300/40 hover:bg-emerald-500/10">
            <Download size={16} /> Export
          </button>
          <Link href="/pssr/new" className="inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500">
            <Plus size={16} /> New PSSR
          </Link>
        </div>
      </div>
    </header>
  );
}
