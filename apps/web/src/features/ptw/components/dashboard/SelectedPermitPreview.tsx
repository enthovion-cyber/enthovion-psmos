import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, ExternalLink, Printer, ShieldAlert, Clock, Calendar, ShieldCheck, Users, FileSignature, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Permit } from '@/services/ptw.service';
import { ptwService } from '@/services/ptw.service';
import { usePermitMutations } from '../../hooks/usePtw';
import { PermitStatusBadge, PermitTypeBadge, RiskBadge } from '../PermitBadges';
import { DashboardPanel, MiniRow, formatDateTime } from './dashboard-ui';

export function SelectedPermitPreview({ permit }: { permit: Permit | null }) {
  const mutations = usePermitMutations(permit?.id);

  if (!permit) {
    return (
      <DashboardPanel title="Selected Permit Preview">
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <Clock className="h-7 w-7 text-slate-400 dark:text-slate-600 mb-1.5 animate-pulse" />
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">No permit selected from the live register ledger.</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Select an operational card entry from the left rail to view real-time telemetry.</p>
        </div>
      </DashboardPanel>
    );
  }

  const latestGas = permit.gasTests?.[0];
  const isolationTotal = permit.isolations?.length ?? 0;
  const isolationComplete = permit.isolations?.filter((item) =>
    ['Confirmed', 'Verified', 'Fully Isolated'].includes(item.isolation_status ?? item.status)
  ).length ?? 0;
  const signaturesDone = permit.signatures?.filter((item) => item.status === 'Signed').length ?? 0;
  const lastHistory = permit.history?.[0];
  const busy = mutations.suspend.isPending || mutations.extend.isPending || mutations.close.isPending;
  const conflictCount = permit.conflicts?.filter((item) => item.status === 'Open').length ?? 0;
  const workforceCount = permit.workforce?.length ?? 0;
  const canSuspend = ['Issued', 'Active', 'Extended'].includes(permit.status);
  const canExtend = ['Issued', 'Active', 'Extended'].includes(permit.status);
  const canClose = ['Active', 'Suspended', 'Extended'].includes(permit.status);

  const suspendFromDashboard = () => {
    if (permit.id && window.confirm(`Suspend ${permit.permit_number}? Backend safety/history checks will be applied.`)) {
      mutations.suspend.mutate('Suspended from PTW control room dashboard');
    }
  };

  const extendFromDashboard = () => {
    if (permit.id && window.confirm(`Request a 4 hour extension for ${permit.permit_number}?`)) {
      const currentExpiry = new Date(permit.planned_end_at).getTime();
      const baseExpiry = Number.isFinite(currentExpiry) ? currentExpiry : Date.now();
      mutations.extend.mutate({
        newExpiryAt: new Date(baseExpiry + 4 * 60 * 60 * 1000).toISOString(),
        reason: 'Dashboard extension request'
      });
    }
  };

  const closeFromDashboard = () => {
    if (permit.id && window.confirm(`Close ${permit.permit_number}? Backend close blockers can still reject this action.`)) {
      mutations.close.mutate('Closed from PTW control room dashboard');
    }
  };

  return (
    <DashboardPanel
      title="Permit Control Card"
      action="Open Detail"
      actionHref={`/ptw/${permit.id}`}
      className="shadow-sm dark:shadow-2xl"
    >
      {/* Top Section: Identification & Live Infographic Countdown */}
      <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
              {permit.permit_number}
            </h2>
            <PermitTypeBadge type={permit.permit_type} />
            <PermitStatusBadge status={permit.status} />
            <RiskBadge risk={permit.risk_level} />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{permit.title}</h3>
          <p className="max-w-4xl text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-900 font-medium">
            {permit.work_description}
          </p>
        </div>

        {/* Real-time Infographic Countdown Widget */}
        <div className="flex justify-start sm:justify-end shrink-0 pt-0.5">
          <RealTimeCountdown targetDateString={permit.planned_end_at} startDateString={permit.planned_start_at} />
        </div>
      </div>

      {/* Middle Section: Meta Data & Metric Sub-grids */}
      <div className="mt-3 grid gap-2.5 grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr]">
        {/* Core Administrative Ledger Row */}
        <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-900 flex flex-col justify-between text-xs">
          <MiniRow label="Holder" value={<span className="font-semibold text-slate-800 dark:text-slate-200">{permit.holder?.displayName ?? '-'}</span>} />
          <MiniRow label="Area / Unit" value={<span className="text-slate-700 dark:text-slate-300 font-medium">{`${permit.area?.name ?? permit.job_area ?? '-'} / ${permit.unit?.name ?? '-'}`}</span>} />
          <MiniRow label="Equipment Tag" value={<span className="text-sky-700 dark:text-cyan-400 font-semibold bg-sky-50 dark:bg-cyan-950/20 px-1.5 py-0.5 rounded border border-sky-200 dark:border-cyan-900/30">{permit.equipment_tag ?? '-'}</span>} />
          <MiniRow label="Start / Expiry" value={<span className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">{`${formatDateTime(permit.planned_start_at)} - ${formatDateTime(permit.planned_end_at)}`}</span>} />
        </div>

        {/* Diagnostic Grid Part 1 */}
        <MetricGrid
          items={[
            {
              label: 'Gas Status',
              value: latestGas?.result ?? 'No test',
              icon: <RefreshCw size={11} />,
              tone: latestGas?.result?.toUpperCase() === 'PASS'
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
            },
            {
              label: 'Isolation Logs',
              value: isolationTotal ? `${isolationComplete}/${isolationTotal}` : 'N/R',
              icon: <ShieldCheck size={11} />,
              tone: isolationComplete === isolationTotal && isolationTotal > 0
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
            },
            {
              label: 'Workforce Roll',
              value: `${workforceCount}/${permit.max_personnel ?? 'open'}`,
              icon: <Users size={11} />,
              tone: 'text-sky-700 dark:text-cyan-400 bg-sky-50 dark:bg-cyan-500/10 border-sky-200 dark:border-cyan-500/20'
            },
            {
              label: 'Signatures',
              value: `${signaturesDone}/${permit.signatures?.length ?? 0}`,
              icon: <FileSignature size={11} />,
              tone: signaturesDone === (permit.signatures?.length ?? 0)
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
            }
          ]}
        />

        {/* Diagnostic Grid Part 2 */}
        <MetricGrid
          items={[
            {
              label: 'SIMOPS Conflicts',
              value: conflictCount,
              icon: <AlertTriangle size={11} />,
              tone: conflictCount
                ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/20 font-bold'
                : 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
            },
            {
              label: 'Shift Handover',
              value: permit.handovers?.some((item) => !item.acknowledged_at) ? 'Pending Check' : 'Acknowledged',
              icon: <Calendar size={11} />,
              tone: permit.handovers?.some((item) => !item.acknowledged_at)
                ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                : 'text-sky-700 dark:text-cyan-400 bg-sky-50 dark:bg-cyan-500/10 border-sky-200 dark:border-cyan-500/20'
            },
            {
              label: 'Latest System Audit Event',
              value: lastHistory?.title ?? lastHistory?.event_title ?? '-',
              icon: <Clock size={11} />,
              tone: 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800',
              wide: true
            }
          ]}
        />
      </div>

      {/* Operations & Action Toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
        <Link
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          href={`/ptw/${permit.id}`}
        >
          <ExternalLink size={13} /> Open Detail
        </Link>

        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-950 bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 transition-all hover:bg-rose-100 dark:hover:bg-rose-900/40 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={busy || !canSuspend}
          onClick={suspendFromDashboard}
          type="button"
        >
          <ShieldAlert size={13} className={busy ? 'animate-spin' : ''} /> Suspend
        </button>

        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={busy || !canExtend}
          onClick={extendFromDashboard}
          type="button"
        >
          Extend Log
        </button>

        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          disabled={busy || !canClose}
          onClick={closeFromDashboard}
          type="button"
        >
          Close Permit
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1" />

        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200 ml-auto shadow-sm"
          onClick={() => window.print()}
          type="button"
        >
          <Printer size={13} /> Print
        </button>

        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 transition-all hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200 shadow-sm"
          onClick={() => window.open(ptwService.certificateUrl(permit.id), '_blank')}
          type="button"
        >
          <Download size={13} /> Export PDF
        </button>
      </div>
    </DashboardPanel>
  );
}

function MetricGrid({ items }: { items: Array<{ label: string; value: string | number; icon: React.ReactNode; tone: string; wide?: boolean }> }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 w-full">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-lg border p-2 flex flex-col justify-between shadow-xs transition-colors ${
            item.wide ? 'col-span-2' : ''
          } ${item.tone}`}
        >
          <div className="flex items-center justify-between gap-1 text-[9px] font-bold uppercase tracking-wider opacity-80">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0">{item.icon}</span>
          </div>
          <div className="mt-1 truncate text-xs font-bold tracking-tight">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function RealTimeCountdown({ targetDateString, startDateString }: { targetDateString: string; startDateString: string }) {
  const [displayTime, setDisplayTime] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    function update() {
      const target = new Date(targetDateString).getTime();
      const now = Date.now();
      const diff = target - now;

      if (!Number.isFinite(target) || diff <= 0) {
        setDisplayTime('EXPIRED');
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setDisplayTime(`${hours}h ${mins}m`);
      } else {
        setDisplayTime(`${mins}m ${secs}s`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDateString, startDateString]);

  return (
    <div
      className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg border text-center transition-all ${
        isExpired
          ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
          : 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
      }`}
    >
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider">
        <Clock size={11} className={isExpired ? 'text-rose-600 dark:text-rose-400' : 'animate-spin text-amber-600 dark:text-amber-400'} />
        <span>{isExpired ? 'Expired' : 'Remaining'}</span>
      </div>
      <div className="mt-0.5 font-mono text-sm sm:text-base font-black tracking-tight leading-none">
        {displayTime}
      </div>
    </div>
  );
}
