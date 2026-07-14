import Link from 'next/link';
import { Download, Plus, RefreshCcw, Wifi } from 'lucide-react';
import type { PermitDashboard } from '@/services/ptw.service';
import { formatClock } from './dashboard-ui';

export function PTWHeader({ dashboard, refreshing, onRefresh, onExport }: { dashboard?: PermitDashboard | undefined; refreshing: boolean; onRefresh: () => void; onExport: () => void }) {
  const shift = dashboard?.currentShift;
  return (
    <header className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Permit to Work Dashboard</h1>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">Live Control Room</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Live permit register, active isolations, gas retests, SIMOPS conflicts, shift handover, and safety-critical work for the active site.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-lg border border-cyan-300/15 bg-[#0b1d31] px-3 py-2 text-xs text-slate-300">
          <div className="font-semibold text-white">{shift?.name ?? 'Current Shift'}</div>
          <div>{shift ? `${formatClock(shift.startAt)} - ${formatClock(shift.endAt)}` : '07:00 - 19:00'}</div>
        </div>
        <div className="inline-flex h-9 items-center gap-2 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-300">
          <Wifi size={14} /> {dashboard?.realtime?.connected ? 'Realtime online' : 'Realtime polling'}
        </div>
        <button className="ptw-toolbar-button" onClick={onRefresh} disabled={refreshing}><RefreshCcw className={refreshing ? 'animate-spin' : ''} size={15} /> Refresh</button>
        <button className="ptw-toolbar-button" onClick={onExport}><Download size={15} /> Export</button>
        <Link className="h-9 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-500" href="/ptw/new">
          <span className="inline-flex h-full items-center gap-2"><Plus size={15} /> New Permit</span>
        </Link>
      </div>
    </header>
  );
}
