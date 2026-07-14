import React from 'react';
import { RefreshCw, ClipboardCheck, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import type { Permit } from '@/services/ptw.service';
import { timeLeft } from './dashboard-ui';

interface HandoverPanelProps {
  data?: Record<string, Permit[]>;
}

export function HandoverPanel({ data }: HandoverPanelProps) {
  const pending = data?.pendingAcknowledgement ?? [];
  const crossing = data?.crossingShift ?? [];
  const nextShift = data?.nextShiftExpiring ?? [];
  const ready = pending.length === 0 && crossing.length === 0;

  return (
    <section className="w-full max-w-md rounded-xl border border-slate-800/80 bg-[#070f1e] p-5 shadow-2xl select-none">
      
      {/* Header Container */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <RefreshCw size={16} className="text-blue-400" />
          Shift Handover
        </h3>
        <a 
          href="/ptw?handoverPending=true" 
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5"
        >
          Open handovers →
        </a>
      </div>

      {/* Main Readiness Hero Banner */}
      <div className={`rounded-lg border p-3.5 transition-all ${
        ready 
          ? 'border-emerald-500/20 bg-emerald-500/5' 
          : 'border-amber-500/20 bg-amber-500/5'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Handover Readiness
            </p>
            <p className={`mt-0.5 text-lg font-black tracking-wide ${ready ? 'text-emerald-400' : 'text-amber-400'}`}>
              {ready ? 'CURRENT' : 'ATTENTION REQUIRED'}
            </p>
          </div>
          <div className="h-12 w-12 flex flex-col items-center justify-center rounded-full border border-slate-800 bg-[#040914] text-slate-200 font-mono font-black shadow-inner">
            <span className="text-base leading-none">{pending.length}</span>
            <span className="text-[8px] uppercase text-slate-500 font-bold mt-0.5">Pend</span>
          </div>
        </div>

        {/* Triple Summary Counter Grid System */}
        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <StatCard label="Crossing" value={crossing.length} tone="text-sky-400" />
          <StatCard label="Pending" value={pending.length} tone={pending.length ? 'text-amber-400 font-black animate-pulse' : 'text-emerald-400'} />
          <StatCard label="Next Shift" value={nextShift.length} tone={nextShift.length ? 'text-red-400' : 'text-slate-500'} />
        </div>
      </div>

      {/* Real-Time Live Handover Action Block Timeline Stream */}
      <div className="mt-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
          <ClipboardCheck size={12} className="text-slate-500" /> Operational Action Items
        </div>

        {/* Max Height Track window handling up to 4 elements safely without text container breaks */}
        <div 
          className="space-y-1.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent hover:scrollbar-thumb-slate-700 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-800 hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
          style={{ maxHeight: '220px' }}
        >
          {[...pending, ...crossing].slice(0, 4).map((permit) => {
            const calculatedTime = timeLeft(permit.planned_end_at);
            const isExpired = calculatedTime === 'Expired';
            
            return (
              <div 
                key={permit.id} 
                className="rounded-md border border-slate-800/60 bg-slate-900/40 p-2.5 transition-all hover:bg-slate-800/40 flex flex-col gap-1 min-w-0"
              >
                <div className="flex items-center justify-between gap-3 w-full">
                  <span className="font-mono font-bold text-slate-200 text-xs truncate">
                    {permit.permit_number}
                  </span>
                  <span className={`text-[10px] font-bold tracking-tight font-mono flex items-center gap-1 flex-shrink-0 ${
                    isExpired ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    <Clock size={10} />
                    {calculatedTime}
                  </span>
                </div>
                
                <p className="truncate text-[11px] text-slate-400 font-medium">
                  {permit.title ?? permit.work_description ?? permit.job_area ?? 'No descriptive baseline payload declared.'}
                </p>
              </div>
            );
          })}

          {/* Secure Safe Clean Operations Empty Window Placeholder Layout Block */}
          {!pending.length && !crossing.length && (
            <div className="py-6 text-center rounded-lg border border-dashed border-slate-800 bg-slate-950/10">
              <CheckCircle size={18} className="mx-auto text-emerald-500 mb-1.5" />
              <p className="text-xs text-slate-500 font-medium">No handover blockers for the active control window.</p>
            </div>
          )}
        </div>
      </div>

    </section>
  );
}

/**
 * Isolated Stat Cellular Segment Box layout context wrapper to eliminate typography scale overflows
 */
function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded border border-slate-800/40 bg-[#040914] p-1.5 flex flex-col items-center justify-center min-w-0 text-center">
      <div className={`text-base font-black font-mono tracking-tight truncate w-full ${tone}`}>
        {value}
      </div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 truncate w-full">
        {label}
      </div>
    </div>
  );
}