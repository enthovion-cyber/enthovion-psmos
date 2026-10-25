import React, { useMemo, useState, useEffect } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Clock, AlertTriangle } from 'lucide-react';
import type { Permit } from '@/services/ptw.service';

interface ExpiringPermitsPanelProps {
  data?: Record<string, Permit[]>;
}

export function ExpiringPermitsPanel({ data }: ExpiringPermitsPanelProps) {
  const withinTwoHours = data?.withinTwoHours ?? [];
  const expiredRows = data?.expired ?? [];
  const withinThirtyMinutes = data?.withinThirtyMinutes ?? [];

  const nextExpiringPermit = useMemo(() => {
    if (!withinTwoHours.length) return null;
    return [...withinTwoHours].sort((a, b) =>
      new Date(a.planned_end_at).getTime() - new Date(b.planned_end_at).getTime()
    )[0];
  }, [withinTwoHours]);

  const outerExpiredRing = useMemo(() => [
    { name: 'Expired', value: expiredRows.length || 0.001 },
    { name: 'Track', value: expiredRows.length ? 0 : 100 }
  ], [expiredRows]);

  const middleCriticalRing = useMemo(() => [
    { name: 'Critical', value: withinThirtyMinutes.length || 0.001 },
    { name: 'Track', value: withinThirtyMinutes.length ? 0 : 100 }
  ], [withinThirtyMinutes]);

  const innerWarningRing = useMemo(() => {
    const warningCount = Math.max(0, withinTwoHours.length - withinThirtyMinutes.length);
    return [
      { name: 'Warning', value: warningCount || 0.001 },
      { name: 'Track', value: warningCount ? 0 : 100 }
    ];
  }, [withinTwoHours, withinThirtyMinutes]);

  const unifiedStream = useMemo(() => {
    return [...expiredRows, ...withinTwoHours];
  }, [withinTwoHours, expiredRows]);

  return (
    <section className="w-full h-full flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl select-none transition-all">
      {/* Top Header Row */}
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Expiring Permits Status
        </h3>
        <a
          href="/ptw?expiringWithin=2"
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition-colors cursor-pointer"
        >
          View expiring →
        </a>
      </div>

      {/* Main Multi-Ring Interface Layout */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/60">
        {/* Left Side: 3-Ring Concentric Circular Target System */}
        <div className="relative flex h-[125px] w-[125px] shrink-0 items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Ring 1 (Outer): Expired Track */}
              <Pie
                data={outerExpiredRing}
                dataKey="value"
                innerRadius={48}
                outerRadius={56}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                <Cell fill={expiredRows.length > 0 ? '#ef4444' : 'rgba(148, 163, 184, 0.2)'} />
                <Cell fill="rgba(148, 163, 184, 0.1)" />
              </Pie>

              {/* Ring 2 (Middle): Critical (<30m) Track */}
              <Pie
                data={middleCriticalRing}
                dataKey="value"
                innerRadius={38}
                outerRadius={45}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                <Cell fill={withinThirtyMinutes.length > 0 ? '#f43f5e' : 'rgba(148, 163, 184, 0.2)'} />
                <Cell fill="rgba(148, 163, 184, 0.1)" />
              </Pie>

              {/* Ring 3 (Inner): Warning (<2h) Track */}
              <Pie
                data={innerWarningRing}
                dataKey="value"
                innerRadius={28}
                outerRadius={35}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                <Cell fill={(withinTwoHours.length - withinThirtyMinutes.length) > 0 ? '#eab308' : 'rgba(148, 163, 184, 0.2)'} />
                <Cell fill="rgba(148, 163, 184, 0.1)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Ring Core */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 pointer-events-none">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block leading-tight">
              Next Expiry
            </span>
            <LiveCenterTicker targetPermit={nextExpiringPermit ?? null} fallbackValue={expiredRows.length ? 'EXPIRED' : '--:--'} />
          </div>
        </div>

        {/* Right Side: Consolidated Quick Stats Metrics Column */}
        <div className="flex w-full flex-1 flex-col justify-center space-y-1.5 min-w-0">
          <div className="flex items-center justify-between text-xs bg-red-50/70 dark:bg-red-950/20 px-2 py-1.5 rounded-lg border border-red-200/80 dark:border-red-900/30">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Expired</span>
            </div>
            <span className="font-bold font-mono text-red-600 dark:text-red-400 text-xs">{expiredRows.length}</span>
          </div>

          <div className="flex items-center justify-between text-xs bg-rose-50/70 dark:bg-rose-950/20 px-2 py-1.5 rounded-lg border border-rose-200/80 dark:border-rose-900/30">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Critical (&lt;30m)</span>
            </div>
            <span className="font-bold font-mono text-rose-600 dark:text-rose-400 text-xs">{withinThirtyMinutes.length}</span>
          </div>

          <div className="flex items-center justify-between text-xs bg-amber-50/70 dark:bg-amber-950/20 px-2 py-1.5 rounded-lg border border-amber-200/80 dark:border-amber-900/30">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Warning (&lt;2h)</span>
            </div>
            <span className="font-bold font-mono text-amber-600 dark:text-amber-400 text-xs">{withinTwoHours.length}</span>
          </div>
        </div>
      </div>

      {/* Bottom Real-Time Queue Timeline Stream */}
      <div className="mt-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
          <Clock size={12} /> Expiry Schedule Activity Queue
        </div>

        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
          {unifiedStream.length > 0 ? (
            unifiedStream.map((permit) => (
              <LiveStreamRow key={permit.id} permit={permit} isTarget={nextExpiringPermit?.id === permit.id} />
            ))
          ) : (
            <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic">
              No immediate permit expiries monitored.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function LiveCenterTicker({ targetPermit, fallbackValue }: { targetPermit: Permit | null; fallbackValue: string }) {
  const [displayTime, setDisplayTime] = useState(fallbackValue);

  useEffect(() => {
    if (!targetPermit) {
      setDisplayTime(fallbackValue);
      return;
    }

    const updateClock = () => {
      const diff = new Date(targetPermit.planned_end_at).getTime() - Date.now();
      if (diff <= 0) {
        setDisplayTime('EXPIRED');
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60)) % 60);
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const hStr = hrs > 0 ? `${hrs}h ` : '';
      setDisplayTime(`${hStr}${mins}m ${secs}s`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [targetPermit, fallbackValue]);

  return (
    <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white tracking-tight mt-0.5 block min-w-[90px]">
      {displayTime}
    </span>
  );
}

function LiveStreamRow({ permit, isTarget }: { permit: Permit; isTarget: boolean }) {
  const [timeText, setTimeText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(permit.planned_end_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeText('EXPIRED');
        setIsPast(true);
        return;
      }
      setIsUrgent(Math.floor(diff / (1000 * 60)) < 30);
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60)) % 60);
      setTimeText(`${hrs > 0 ? `${hrs}h ` : ''}${mins}m left`);
    };
    calc();
    const timer = setInterval(calc, 60000);
    return () => clearInterval(timer);
  }, [permit.planned_end_at]);

  return (
    <div
      className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
        isPast
          ? 'border-red-200 dark:border-red-500/20 bg-red-50/70 dark:bg-red-950/20 text-red-700 dark:text-red-400'
          : isUrgent
            ? 'border-rose-200 dark:border-rose-500/20 bg-rose-50/70 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 animate-pulse'
            : isTarget
              ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-semibold'
              : 'border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        {(isUrgent || isPast) && <AlertTriangle size={12} className="shrink-0" />}
        <span className="font-mono font-bold truncate">{permit.permit_number}</span>
      </div>
      <span className="font-mono text-[10px] font-bold bg-white/80 dark:bg-slate-950/40 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800/40 shrink-0">
        {timeText}
      </span>
    </div>
  );
}
