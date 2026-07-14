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
    }
  }>;

  // Extract the most current active reading payload directly from real data arrays
  const latestRecord = useMemo(() => latest.find((item) => item.latest), [latest]);
  const latestGas = latestRecord?.latest;

  // Real data state checking with clear explicit null/undefined guards
  const o2 = latestGas?.o2;
  const lel = latestGas?.lel;
  const h2s = latestGas?.h2s;
  const co = latestGas?.co;

  // Evaluate dynamic safety thresholds against real live data variables
  const isO2Safe = o2 !== undefined && o2 !== null ? (o2 >= 19.5 && o2 <= 23.5) : null;
  const isLelSafe = lel !== undefined && lel !== null ? (lel < 10) : null;
  const isH2sSafe = h2s !== undefined && h2s !== null ? (h2s < 1) : null;
  const isCoSafe = co !== undefined && co !== null ? (co < 25) : null;

  // Select the highest priority expiring permit from the real active operational queue
  const primaryPermit = useMemo(() => {
    const combined = [...overdue, ...dueSoon];
    return combined.length > 0 ? combined[0] : null;
  }, [dueSoon, overdue]);

  return (
    <section className="w-full max-w-md rounded-xl border border-slate-800/80 bg-[#070f1e] p-5 shadow-2xl select-none">
      
      {/* Header Container */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          Gas Test Status <span className="text-xs text-slate-400 lowercase font-normal">(Latest)</span>
        </h3>
        <a 
          href="/ptw?gasRetestDue=true" 
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5"
        >
          View all →
        </a>
      </div>

      {/* Gas Matrix Dynamic Row Grid */}
      <div className="space-y-2">
        
        {/* Oxygen (O2) */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/20 px-4 py-2.5 transition-all hover:bg-slate-900/40">
          <div className="w-16 font-semibold text-slate-300 text-sm">O₂</div>
          <div className={`text-sm font-bold tracking-wide w-20 text-left ${isO2Safe === null ? 'text-slate-500' : isO2Safe ? 'text-emerald-400' : 'text-red-400'}`}>
            {o2 !== undefined && o2 !== null ? `${o2.toFixed(1)} %` : '-- %'}
          </div>
          <div className="text-xs text-slate-500 font-medium w-24 text-left">19.5 - 23.5</div>
          <span className={`text-[11px] font-black px-2 py-0.5 rounded tracking-wider border ${
            isO2Safe === null ? 'bg-slate-800/20 border-slate-700/30 text-slate-500' :
            isO2Safe ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {isO2Safe === null ? 'N/A' : isO2Safe ? 'PASS' : 'FAIL'}
          </span>
        </div>

        {/* LEL (Explosives) */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/20 px-4 py-2.5 transition-all hover:bg-slate-900/40">
          <div className="w-16 font-semibold text-slate-300 text-sm">LEL</div>
          <div className={`text-sm font-bold tracking-wide w-20 text-left ${isLelSafe === null ? 'text-slate-500' : isLelSafe ? 'text-emerald-400' : 'text-red-400'}`}>
            {lel !== undefined && lel !== null ? `${lel} %` : '-- %'}
          </div>
          <div className="text-xs text-slate-500 font-medium w-24 text-left">&lt; 10 %</div>
          <span className={`text-[11px] font-black px-2 py-0.5 rounded tracking-wider border ${
            isLelSafe === null ? 'bg-slate-800/20 border-slate-700/30 text-slate-500' :
            isLelSafe ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {isLelSafe === null ? 'N/A' : isLelSafe ? 'PASS' : 'FAIL'}
          </span>
        </div>

        {/* H2S (Hydrogen Sulfide) */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/20 px-4 py-2.5 transition-all hover:bg-slate-900/40">
          <div className="w-16 font-semibold text-slate-300 text-sm">H₂S</div>
          <div className={`text-sm font-bold tracking-wide w-20 text-left ${isH2sSafe === null ? 'text-slate-500' : isH2sSafe ? 'text-emerald-400' : 'text-red-400'}`}>
            {h2s !== undefined && h2s !== null ? `${h2s} ppm` : '-- ppm'}
          </div>
          <div className="text-xs text-slate-500 font-medium w-24 text-left">&lt; 1 ppm</div>
          <span className={`text-[11px] font-black px-2 py-0.5 rounded tracking-wider border ${
            isH2sSafe === null ? 'bg-slate-800/20 border-slate-700/30 text-slate-500' :
            isH2sSafe ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {isH2sSafe === null ? 'N/A' : isH2sSafe ? 'PASS' : 'FAIL'}
          </span>
        </div>

        {/* CO (Carbon Monoxide) */}
        <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/20 px-4 py-2.5 transition-all hover:bg-slate-900/40">
          <div className="w-16 font-semibold text-slate-300 text-sm">CO</div>
          <div className={`text-sm font-bold tracking-wide w-20 text-left ${isCoSafe === null ? 'text-slate-500' : isCoSafe ? 'text-emerald-400' : 'text-red-400'}`}>
            {co !== undefined && co !== null ? `${co} ppm` : '-- ppm'}
          </div>
          <div className="text-xs text-slate-500 font-medium w-24 text-left">&lt; 25 ppm</div>
          <span className={`text-[11px] font-black px-2 py-0.5 rounded tracking-wider border ${
            isCoSafe === null ? 'bg-slate-800/20 border-slate-700/30 text-slate-500' :
            isCoSafe ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {isCoSafe === null ? 'N/A' : isCoSafe ? 'PASS' : 'FAIL'}
          </span>
        </div>

      </div>

      {/* Footer Live Meta Tracker Tracking Row */}
      <div className="mt-4 pt-3 border-t border-slate-800/50 flex flex-col space-y-1 text-xs">
        {latestRecord?.tested_at ? (
          <div className="text-slate-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Last Test: <span className="text-slate-300 font-semibold">{latestRecord.tested_at}</span>
            {latestRecord?.tester_name && (
              <span className="text-slate-500">({latestRecord.tester_name})</span>
            )}
          </div>
        ) : (
          <div className="text-slate-500 font-medium flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-slate-600" />
            No baseline gas tests submitted yet.
          </div>
        )}
        
        {/* Dynamic Real Data Ticker Engine */}
        <LiveGasCountdown permit={primaryPermit} isOverdue={overdue.length > 0} />
      </div>

    </section>
  );
}

/**
 * Isolated Real-Time Target Expiry Countdown Sub-Component (Pure Production Real-Data Driven)
 */
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

      const durationString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m remaining`;
      setDisplayString(`${timeLabel} (${durationString})`);
    };

    tick();
    const intervalId = setInterval(tick, 30000); 
    return () => clearInterval(intervalId);
  }, [permit, isOverdue]);

  return (
    <div className={`font-medium flex items-center gap-1.5 mt-0.5 ${isAlert ? 'text-red-400' : 'text-amber-500'}`}>
      {isAlert ? <AlertTriangle size={13} className="animate-pulse" /> : <Clock size={13} />}
      <span>Next Test Due:</span>
      <span className="font-bold tracking-wide font-mono">{displayString}</span>
    </div>
  );
}