'use client';

import Link from 'next/link';
import { Activity, Download, FilePlus2, RefreshCw, ShieldAlert } from 'lucide-react';

export function MOCDashboardHeader({ generatedAt, onRefresh, onExport }: { generatedAt?: string | undefined; onRefresh: () => void; onExport: () => void }) {
  return (
    <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-blue-200"><ShieldAlert size={15} /> Module 04</p>
        <h1 className="mt-1 text-3xl font-black text-white">Management of Change Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">Enterprise control room for MOC register health, temporary and emergency changes, approval queues, risk exposure, startup readiness, and closed-loop action performance.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-lg border border-emerald-300/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100">
          <Activity className="mr-2 inline" size={14} /> Live data {generatedAt ? `- ${new Date(generatedAt).toLocaleTimeString()}` : ''}
        </div>
        <button onClick={onRefresh} className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 bg-white/[0.03] px-4 text-sm font-black text-slate-100 hover:border-blue-300/40">
          <RefreshCw size={16} /> Refresh
        </button>
        <button onClick={onExport} className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/15 bg-white/[0.03] px-4 text-sm font-black text-slate-100 hover:border-blue-300/40">
          <Download size={16} /> Export
        </button>
        <Link href="/moc/new" className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-black text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500">
          <FilePlus2 size={16} /> New MOC
        </Link>
      </div>
    </header>
  );
}
