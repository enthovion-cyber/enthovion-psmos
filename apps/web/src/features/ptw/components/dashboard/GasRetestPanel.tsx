import React, { useMemo, useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Permit } from '@/services/ptw.service';

interface GasRetestPanelProps {
  data?: Record<string, any>;
}

export function GasRetestPanel({ data }: GasRetestPanelProps) {
  const dueSoon = (data?.dueSoon ?? []) as Permit[];
  const overdue = (data?.overdue ?? []) as Permit[];
  const latest = (data?.latest ?? []) as Array<{
    tester_name?: string;
    tested_at?: string;
    latest?: {
      o2?: number | null;
      lel?: number | null;
      h2s?: number | null;
      co?: number | null;
      result?: string;
    };
  }>;

  const latestRecord = useMemo(() => latest.find((item) => item.latest), [latest]);
  const latestGas = latestRecord?.latest;

  const o2 = latestGas?.o2;
  const lel = latestGas?.lel;
  const h2s = latestGas?.h2s;
  const co = latestGas?.co;

  const isO2Safe = o2 !== undefined && o2 !== null ? (o2 >= 19.5 && o2 <= 23.5) : null;
  const isLelSafe = lel !== undefined && lel !== null ? (lel < 10) : null;
  const isH2sSafe = h2s !== undefined && h2s !== null ? (h2s < 1) : null;
  const isCoSafe = co !== undefined && co !== null ? (co < 25) : null;

  const primaryPermit = useMemo(() => {
    const combined = [...overdue, ...dueSoon];
    return combined.length > 0 ? combined[0] : null;
  }, [dueSoon, overdue]);

  return (
    <section className="w-full rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl select-none transition-all">
      {/* Header Container */}
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          Gas Test Status <span className="text-[10px] text-slate-400 dark:text-slate-500 lowercase font-normal">(latest)</span>
        </h3>
        <a
          href="/ptw?gasRetestDue=true"
          className="text-xs font-bold text-primary dark:text-sky-400 hover:underline transition-colors flex items-center gap-0.5"
        >
          View all →
        </a>
      </div>

      {/* Gas Matrix Dynamic Row Grid */}
      <div className="space-y-2">
        {/* Oxygen (O2) */}
        <GasRow label="O₂" value={o2 !== undefined && o2 !== null ? `${o2.toFixed(1)} %` : '-- %'} range="19.5 - 23.5" isSafe={isO2Safe} />
        {/* LEL */}
        <GasRow label="LEL" value={lel !== undefined && lel !== null ? `${lel} %` : '-- %'} range="< 10 %" isSafe={isLelSafe} />
        {/* H2S */}
        <GasRow label="H₂S" value={h2s !== undefined && h2s !== null ? `${h2s} ppm` : '-- ppm'} range="< 1 ppm" isSafe={isH2sSafe} />
        {/* CO */}
        <GasRow label="CO" value={co !== undefined && co !== null ? `${co} ppm` : '-- ppm'} range="< 25 ppm" isSafe={isCoSafe} />
      </div>

      {/* Footer Live Meta Tracker Tracking Row */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/50 flex flex-col space-y-1 text-xs">
        {latestRecord?.tested_at ? (
          <div className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5 truncate">
            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            <span>Last Test: <strong className="text-slate-900 dark:text-slate-300 font-semibold">{latestRecord.tested_at}</strong></span>
            {latestRecord?.tester_name && (
              <span className="text-slate-400 truncate">({latestRecord.tester_name})</span>
            )}
          </div>
        ) : (
          <div className="text-slate-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-slate-400" />
            No baseline gas tests submitted yet.
          </div>
        )}

        <LiveGasCountdown permit={primaryPermit ?? null} isOverdue={overdue.length > 0} />
      </div>
    </section>
  );
}

function GasRow({ label, value, range, isSafe }: { label: string; value: string; range: string; isSafe: boolean | null }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/20 px-3.5 py-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-900/40 text-xs">
      <div className="w-12 font-bold text-slate-800 dark:text-slate-200">{label}</div>
      <div className={`font-mono font-bold tracking-wide w-20 text-left ${isSafe === null ? 'text-slate-400' : isSafe ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
        {value}
      </div>
      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono w-24 text-left">{range}</div>
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded tracking-wider border shrink-0 ${
          isSafe === null
            ? 'bg-slate-100 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700/30 text-slate-500'
            : isSafe
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/20 text-red-800 dark:text-red-300'
        }`}
      >
        {isSafe === null ? 'N/A' : isSafe ? 'PASS' : 'FAIL'}
      </span>
    </div>
  );
}

function LiveGasCountdown({ permit, isOverdue }: { permit: Permit | null; isOverdue: boolean }) {
  const [displayString, setDisplayString] = useState('--:--');
  const [isAlert, setIsAlert] = useState(isOverdue);

  useEffect(() => {
    if (!permit) {
      setDisplayString('No active sweeps scheduled');
      setIsAlert(false);
      return;
    }

    const firstGasTest = permit.gasTests?.[0];
    const rawTargetTime = firstGasTest?.next_test_due_at ?? firstGasTest?.next_retest_due_at;

    if (!rawTargetTime) {
      setDisplayString('Pending schedule assignment');
      setIsAlert(false);
      return;
    }

    const tick = () => {
      const targetMs = new Date(rawTargetTime).getTime();
      const diff = targetMs - Date.now();

      const timeLabel = new Date(rawTargetTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      if (diff <= 0) {
        setDisplayString(`${timeLabel} (OVERDUE)`);
        setIsAlert(true);
        return;
      }

      setIsAlert(isOverdue);
      const totalMinutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      const durationString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m left`;
      setDisplayString(`${timeLabel} (${durationString})`);
    };

    tick();
    const intervalId = setInterval(tick, 30000);
    return () => clearInterval(intervalId);
  }, [permit, isOverdue]);

  return (
    <div className={`font-semibold flex items-center gap-1.5 mt-0.5 text-xs ${isAlert ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
      {isAlert ? <AlertTriangle size={13} className="animate-pulse shrink-0" /> : <Clock size={13} className="shrink-0" />}
      <span>Next Test:</span>
      <span className="font-bold tracking-wide font-mono">{displayString}</span>
    </div>
  );
}
