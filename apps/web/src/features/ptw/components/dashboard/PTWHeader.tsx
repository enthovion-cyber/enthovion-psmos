import Link from 'next/link';
import { AlertOctagon, Download, Plus, RefreshCcw, Wifi } from 'lucide-react';
import type { PermitDashboard } from '@/services/ptw.service';
import { formatClock } from './dashboard-ui';

export function PTWHeader({
  dashboard,
  refreshing,
  onRefresh,
  onExport,
  onEmergencySuspend
}: {
  dashboard?: PermitDashboard | undefined;
  refreshing: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onEmergencySuspend?: () => void;
}) {
  const shift = dashboard?.currentShift;
  return (
    <header className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono uppercase">
            Permit to Work Dashboard
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/80 dark:border-emerald-400/30 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Control Room
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Live permit register, active isolations, gas retests, SIMOPS conflicts, shift handover, and safety-critical work for the active site.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1829] px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
          <div className="font-bold text-[11px] text-slate-900 dark:text-white leading-tight">{shift?.name ?? 'Current Shift'}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            {shift ? `${formatClock(shift.startAt)} - ${formatClock(shift.endAt)}` : '07:00 - 19:00'}
          </div>
        </div>
        <div className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300/80 dark:border-emerald-400/40 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 shadow-xs">
          <Wifi size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span>{dashboard?.realtime?.connected ? 'Realtime online' : 'Realtime polling'}</span>
        </div>
        <button
          className="ptw-toolbar-button h-8 px-2.5 text-xs"
          onClick={onRefresh}
          disabled={refreshing}
          type="button"
          title="Refresh dashboard"
        >
          <RefreshCcw className={refreshing ? 'animate-spin' : ''} size={13} /> Refresh
        </button>
        <button
          className="ptw-toolbar-button h-8 px-2.5 text-xs"
          onClick={onExport}
          type="button"
          title="Export dashboard report"
        >
          <Download size={13} /> Export
        </button>
        {onEmergencySuspend && (
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/60 bg-red-50 dark:bg-red-600/20 px-2.5 text-xs font-bold text-red-700 dark:text-red-300 shadow-xs hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all active:scale-95"
            onClick={onEmergencySuspend}
            title="Emergency Suspend All Permits"
            type="button"
          >
            <AlertOctagon size={13} className="animate-pulse text-red-600 dark:text-red-400" /> Emergency Suspend
          </button>
        )}
        <Link
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-white shadow-xs hover:bg-action-primary-hover active:scale-95 transition-all"
          href="/ptw/new"
        >
          <Plus size={14} /> New Permit
        </Link>
      </div>
    </header>
  );
}
