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
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-950/20 rounded-xl border border-slate-900">
          <Clock className="h-8 w-8 text-slate-700 mb-2 animate-pulse" />
          <p className="text-xs text-slate-400 font-medium">No permit selected from the live register ledger.</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Select an operational card entry from the left rail to view real-time telemetry.</p>
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
      className="bg-slate-950/40 border border-slate-800/80 shadow-2xl rounded-xl transition-all duration-300"
    >
      {/* Top Section: Identification & Live Infographic Countdown */}
      <div className="flex flex-col gap-4 border-b border-slate-900 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white bg-slate-900/80 px-2.5 py-0.5 rounded border border-slate-800">
              {permit.permit_number}
            </h2>
            <PermitTypeBadge type={permit.permit_type} />
            <PermitStatusBadge status={permit.status} />
            <RiskBadge risk={permit.risk_level} />
          </div>
          <h3 className="text-sm font-semibold text-slate-200 truncate">{permit.title}</h3>
          <p className="max-w-4xl text-xs leading-relaxed text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-900/60 font-medium">
            {permit.work_description}
          </p>
        </div>

        {/* Real-time Infographic Countdown Widget */}
        <div className="flex justify-start sm:justify-end shrink-0 pt-1">
          <RealTimeCountdown targetDateString={permit.planned_end_at} startDateString={permit.planned_start_at} />
        </div>
      </div>

      {/* Middle Section: Meta Data & Metric Sub-grids */}
      <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr]">
        {/* Core Administrative Ledger Row */}
        <div className="space-y-2 bg-slate-950/50 p-3 rounded-xl border border-slate-900 flex flex-col justify-between text-xs">
          <MiniRow label="Holder" value={<span className="font-semibold text-slate-200">{permit.holder?.displayName ?? '-'}</span>} />
          <MiniRow label="Area / Unit" value={<span className="text-slate-300 font-medium">{`${permit.area?.name ?? permit.job_area ?? '-'} / ${permit.unit?.name ?? '-'}`}</span>} />
          <MiniRow label="Equipment Tag" value={<span className="text-cyan-400 font-semibold bg-cyan-950/20 px-1.5 py-0.2 rounded border border-cyan-900/30">{permit.equipment_tag ?? '-'}</span>} />
          <MiniRow label="Start / Expiry" value={<span className="text-slate-400 text-[11px]">{`${formatDateTime(permit.planned_start_at)} - ${formatDateTime(permit.planned_end_at)}`}</span>} />
        </div>

        {/* Diagnostic Grid Part 1 */}
        <MetricGrid
          items={[
            { label: 'Gas Status', value: latestGas?.result ?? 'No test', icon: <RefreshCw size={11} />, tone: latestGas?.result?.toUpperCase() === 'PASS' ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' : 'text-amber-400 bg-amber-500/5 border-amber-500/20' },
            { label: 'Isolation Logs', value: isolationTotal ? `${isolationComplete}/${isolationTotal}` : 'N/R', icon: <ShieldCheck size={11} />, tone: isolationComplete === isolationTotal && isolationTotal > 0 ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' : 'text-amber-400 bg-amber-500/5 border-amber-500/20' },
            { label: 'Workforce Roll', value: `${workforceCount}/${permit.max_personnel ?? 'open'}`, icon: <Users size={11} />, tone: 'text-cyan-400 bg-cyan-500/5 border-cyan-500/20' },
            { label: 'Signatures', value: `${signaturesDone}/${permit.signatures?.length ?? 0}`, icon: <FileSignature size={11} />, tone: signaturesDone === (permit.signatures?.length ?? 0) ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' : 'text-amber-400 bg-amber-500/5 border-amber-500/20' }
          ]}
        />

        {/* Diagnostic Grid Part 2 */}
        <MetricGrid
          items={[
            { label: 'SIMOPS Conflicts', value: conflictCount, icon: <AlertTriangle size={11} />, tone: conflictCount ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse font-bold' : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' },
            { label: 'Shift Handover', value: permit.handovers?.some((item) => !item.acknowledged_at) ? 'Pending Check' : 'Acknowledged', icon: <Calendar size={11} />, tone: permit.handovers?.some((item) => !item.acknowledged_at) ? 'text-amber-400 bg-amber-500/5 border-amber-500/20' : 'text-cyan-400 bg-cyan-500/5 border-cyan-500/20' },
            { label: 'Latest System Audit Event', value: lastHistory?.title ?? lastHistory?.event_title ?? '-', icon: <Clock size={11} />, tone: 'text-slate-300 bg-slate-900/60 border-slate-800/60', wide: true }
          ]}
        />
      </div>

      {/* Operations & Action Toolbar */}
      <div className="mt-5 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-900">
        <Link 
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white" 
          href={`/ptw/${permit.id}`}
        >
          <ExternalLink size={13} /> Open Detail
        </Link>
        
        <button 
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-950 bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-all hover:bg-rose-900/40 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-30" 
          disabled={busy || !canSuspend} 
          onClick={suspendFromDashboard}
        >
          <ShieldAlert size={13} className={busy ? 'animate-spin' : ''} /> Suspend
        </button>
        
        <button 
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30" 
          disabled={busy || !canExtend} 
          onClick={extendFromDashboard}
        >
          Extend Log
        </button>
        
        <button 
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30" 
          disabled={busy || !canClose} 
          onClick={closeFromDashboard}
        >
          Close Permit
        </button>
        
        <div className="h-4 w-px bg-slate-900 hidden sm:block mx-1" />

        <button 
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-slate-400 transition-all hover:border-slate-700 hover:text-slate-200 ml-auto" 
          onClick={() => window.print()}
        >
          <Printer size={13} /> Print
        </button>
        
        <button 
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs font-semibold text-slate-400 transition-all hover:border-slate-700 hover:text-slate-200" 
          onClick={() => window.open(ptwService.certificateUrl(permit.id), '_blank')}
        >
          <Download size={13} /> Export PDF
        </button>
      </div>
    </DashboardPanel>
  );
}

function MetricGrid({ items }: { items: Array<{ label: string; value: string | number; icon: React.ReactNode; tone: string; wide?: boolean }> }) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {items.map((item) => (
        <div 
          key={item.label} 
          className={`rounded-xl border p-2.5 flex flex-col justify-between shadow-sm backdrop-blur-md ${
            item.wide ? 'col-span-2' : ''
          } ${item.tone}`}
        >
          <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <span>{item.label}</span>
            <span className="text-slate-600 shrink-0">{item.icon}</span>
          </div>
          <div className="mt-1.5 truncate text-xs font-bold tracking-wide">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function RealTimeCountdown({ targetDateString, startDateString }: { targetDateString: string; startDateString: string }) {
  const [displayTime, setDisplayTime] = useState('');
  const [percentageLeft, setPercentageLeft] = useState(100);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now();
      const end = new Date(targetDateString).getTime();
      const start = new Date(startDateString).getTime();
      const totalDuration = end - start;
      const remaining = end - now;

      if (remaining <= 0) {
        setDisplayTime('EXPIRED');
        setPercentageLeft(0);
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      const diffHrs = Math.floor(remaining / (1000 * 60 * 60));
      const diffMins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((remaining % (1000 * 60)) / 1000);

      const hrsStr = diffHrs > 0 ? `${diffHrs}h ` : '';
      setDisplayTime(`${hrsStr}${diffMins}m ${diffSecs}s`);

      if (totalDuration > 0) {
        const pct = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
        setPercentageLeft(pct);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDateString, startDateString]);

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentageLeft / 100) * circumference;

  return (
    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-950 border border-slate-900 shadow-xl">
      <svg className="absolute -rotate-90 transform" width="80" height="80">
        <circle 
          cx="40" cy="40" r={radius} 
          className="stroke-slate-900" strokeWidth="4" fill="transparent" 
        />
        <circle
          cx="40" cy="40" r={radius}
          className={`transition-all duration-1000 ease-linear ${isExpired ? 'stroke-rose-500' : percentageLeft < 20 ? 'stroke-amber-500' : 'stroke-cyan-500'}`}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      <div className="text-center z-10 p-1">
        <Clock size={11} className={`mx-auto mb-0.5 ${isExpired ? 'text-rose-400' : 'text-cyan-400 animate-pulse'}`} />
        <div className={`text-[10px] font-bold tracking-tighter ${isExpired ? 'text-rose-400' : 'text-slate-200'}`}>
          {displayTime}
        </div>
        <div className="text-[8px] font-bold tracking-wider uppercase text-slate-500 mt-0.5">
          Timer
        </div>
      </div>
    </div>
  );
}