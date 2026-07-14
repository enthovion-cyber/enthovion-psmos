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

  // Calculate the single closest upcoming target expiration timestamp for the center countdown
  const nextExpiringPermit = useMemo(() => {
    if (!withinTwoHours.length) return null;
    return [...withinTwoHours].sort((a, b) => 
      new Date(a.planned_end_at).getTime() - new Date(b.planned_end_at).getTime()
    )[0];
  }, [withinTwoHours]);

  // 1. Structure 3 distinct datasets for the 3 separate concentric layers
  const outerExpiredRing = useMemo(() => [
    { name: 'Expired', value: expiredRows.length || 0.001 }, // micro fallback prevents Recharts render anomalies on 0
    { name: 'Track', value: expiredRows.length ? 0 : 100 }
  ], [expiredRows]);

  const middleCriticalRing = useMemo(() => [
    { name: 'Critical', value: withinThirtyMinutes.length || 0.001 },
    { name: 'Track', value: withinThirtyMinutes.length ? 0 : 100 }
  ], [withinThirtyMinutes]);

  const innerWarningRing = useMemo(() => {
    // Prevent double counting: warning represents the outer window excluding immediate 30m criticals
    const warningCount = Math.max(0, withinTwoHours.length - withinThirtyMinutes.length);
    return [
      { name: 'Warning', value: warningCount || 0.001 },
      { name: 'Track', value: warningCount ? 0 : 100 }
    ];
  }, [withinTwoHours, withinThirtyMinutes]);

  // Combine datasets cleanly for the unified scroll list
  const unifiedStream = useMemo(() => {
    return [...expiredRows, ...withinTwoHours];
  }, [withinTwoHours, expiredRows]);

  return (
    <section className="w-full max-w-lg rounded-xl border border-[#1e293b] bg-[#0f172a] p-5 shadow-lg select-none">
      
      {/* Top Header Row */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white tracking-wide">
          Expiring Permits Status
        </h3>
        <a 
          href="/ptw?expiringWithin=2" 
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
        >
          View expiring →
        </a>
      </div>

      {/* Main Multi-Ring Interface Layout */}
      <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-slate-800/60">
        
        {/* Left Side: 3-Ring Concentric Circular Target System */}
        <div className="relative flex h-[220px] w-full flex-1 items-center justify-center sm:max-w-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Ring 1 (Outer): Expired Track */}
              <Pie
                data={outerExpiredRing}
                dataKey="value"
                innerRadius={84}
                outerRadius={94}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                <Cell fill={expiredRows.length > 0 ? '#ef4444' : '#1e293b/30'} />
                <Cell fill="rgba(30, 41, 59, 0.15)" />
              </Pie>

              {/* Ring 2 (Middle): Critical (<30m) Track */}
              <Pie
                data={middleCriticalRing}
                dataKey="value"
                innerRadius={68}
                outerRadius={78}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                <Cell fill={withinThirtyMinutes.length > 0 ? '#f43f5e' : '#1e293b/30'} />
                <Cell fill="rgba(30, 41, 59, 0.15)" />
              </Pie>

              {/* Ring 3 (Inner): Warning (<2h) Track */}
              <Pie
                data={innerWarningRing}
                dataKey="value"
                innerRadius={52}
                outerRadius={62}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                <Cell fill={(withinTwoHours.length - withinThirtyMinutes.length) > 0 ? '#eab308' : '#1e293b/30'} />
                <Cell fill="rgba(30, 41, 59, 0.15)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centered Ring Core: Real-Time Active Countdown Timer */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Next Expiry In
            </span>
            <LiveCenterTicker targetPermit={nextExpiringPermit} fallbackValue={expiredRows.length ? 'EXPIRED' : '--:--:--'} />
          </div>
        </div>

        {/* Right Side: Consolidated Quick Stats Metrics Column */}
        <div className="flex w-full flex-col justify-center space-y-2.5 sm:w-[220px]">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">
            Risk Quantities
          </h4>
          
          <div className="flex items-center justify-between text-[13px] bg-red-950/20 p-2 rounded-md border border-red-900/30">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="font-medium text-slate-300">Expired</span>
            </div>
            <span className="font-bold text-red-400">{expiredRows.length}</span>
          </div>

          <div className="flex items-center justify-between text-[13px] bg-rose-950/20 p-2 rounded-md border border-rose-900/30">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="font-medium text-slate-300">Critical (&lt;30m)</span>
            </div>
            <span className="font-bold text-rose-400">{withinThirtyMinutes.length}</span>
          </div>

          <div className="flex items-center justify-between text-[13px] bg-amber-950/20 p-2 rounded-md border border-amber-900/30">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="font-medium text-slate-300">Warning (&lt;2h)</span>
            </div>
            <span className="font-bold text-amber-400">{withinTwoHours.length}</span>
          </div>
        </div>
      </div>

      {/* Bottom Real-Time Queue Timeline Stream */}
      <div className="mt-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
          <Clock size={12} /> Expiry Schedule Activity Queue
        </div>

        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-600 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-700">
          {unifiedStream.length > 0 ? (
            unifiedStream.map((permit) => (
              <LiveStreamRow key={permit.id} permit={permit} isTarget={nextExpiringPermit?.id === permit.id} />
            ))
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 italic">
              No immediate permit expiries monitored.
            </div>
          )}
        </div>
      </div>

    </section>
  );
}

/**
 * Center Clock Countdown Component (Prevents panel layout lag)
 */
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
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const hStr = hrs > 0 ? `${hrs}h ` : '';
      setDisplayTime(`${hStr}${mins}m ${secs}s`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [targetPermit, fallbackValue]);

  return (
    <span className="text-[20px] font-black font-mono text-white tracking-wide mt-1 block drop-shadow-sm min-w-[110px]">
      {displayTime}
    </span>
  );
}

/**
 * Activity Queue Row Component
 */
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
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      setTimeText(`${hrs > 0 ? `${hrs}h ` : ''}${mins}m left`);
    };
    calc();
    const timer = setInterval(calc, 60000); // Efficient 1-minute ticking for sub-rows
    return () => clearInterval(timer);
  }, [permit.planned_end_at]);

  return (
    <div className={`flex items-center justify-between p-2 rounded-md border text-[12px] transition-all ${
      isPast ? 'border-red-500/20 bg-red-950/10 text-red-400' :
      isUrgent ? 'border-rose-500/20 bg-rose-950/10 text-rose-400 animate-pulse' :
      isTarget ? 'border-amber-500/40 bg-amber-950/20 text-amber-300' : 'border-slate-800/60 bg-slate-900/40 text-slate-300'
    }`}>
      <div className="flex items-center gap-2 truncate">
        {(isUrgent || isPast) && <AlertTriangle size={12} />}
        <span className="font-mono font-semibold truncate">{permit.permit_number}</span>
      </div>
      <span className="font-mono text-[11px] font-bold bg-slate-950/40 px-2 py-0.5 rounded border border-slate-800/30">
        {timeText}
      </span>
    </div>
  );
}