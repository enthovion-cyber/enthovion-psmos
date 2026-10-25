import React from 'react';
import { RefreshCw } from 'lucide-react';
import type { Permit } from '@/services/ptw.service';

interface HandoverPanelProps {
  data?: Record<string, Permit[]>;
}

export function HandoverPanel({ data }: HandoverPanelProps) {
  const pending = data?.pendingAcknowledgement ?? [];
  const crossing = data?.crossingShift ?? [];
  const nextShift = data?.nextShiftExpiring ?? [];
  const ready = pending.length === 0 && crossing.length === 0;

  return (
    <section className="w-full h-full flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c1829] p-3.5 sm:p-4 shadow-xs dark:shadow-xl select-none transition-all">
      {/* Header Container */}
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <RefreshCw size={13} className="text-primary dark:text-sky-400" />
          Shift Handover
        </h3>
        <a
          href="/ptw?handoverPending=true"
          className="text-xs font-bold text-primary dark:text-sky-400 hover:underline transition-colors flex items-center gap-0.5"
        >
          Open handovers →
        </a>
      </div>

      {/* Main Readiness Hero Banner */}
      <div
        className={`rounded-lg border p-3 transition-all ${
          ready
            ? 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-500/5'
            : 'border-amber-200 dark:border-amber-500/20 bg-amber-50/70 dark:bg-amber-500/5'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Handover Readiness
            </p>
            <p
              className={`mt-0.5 text-sm sm:text-base font-bold tracking-tight ${
                ready ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {ready ? 'CURRENT' : 'ATTENTION REQUIRED'}
            </p>
          </div>
          <div className="h-9 w-9 flex flex-col items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#040914] text-slate-800 dark:text-slate-200 font-mono font-bold shadow-xs">
            <span className="text-xs leading-none">{pending.length}</span>
            <span className="text-[7px] uppercase text-slate-400 font-bold">Pend</span>
          </div>
        </div>

        {/* Triple Summary Counter Grid System */}
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          <StatCard label="Crossing" value={crossing.length} tone="text-sky-700 dark:text-sky-400" />
          <StatCard
            label="Pending"
            value={pending.length}
            tone={pending.length ? 'text-amber-700 dark:text-amber-400 font-black animate-pulse' : 'text-emerald-700 dark:text-emerald-400'}
          />
          <StatCard label="Next Shift" value={nextShift.length} tone={nextShift.length ? 'text-red-700 dark:text-red-400' : 'text-slate-500'} />
        </div>
      </div>

      {/* Handover Permits Activity Row */}
      {pending.length > 0 && (
        <div className="mt-2.5 space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
          {pending.slice(0, 4).map((permit) => (
            <div
              key={permit.id}
              className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-1.5 text-xs hover:border-amber-300 dark:hover:border-amber-500/40 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono font-bold text-amber-800 dark:text-amber-300 shrink-0">
                  {permit.permit_number}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {permit.title}
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.5 rounded shrink-0">
                Acknowledge Due
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-200/80 dark:border-slate-800/40 bg-white/80 dark:bg-[#040914] p-2 text-center shadow-xs">
      <div className={`text-base sm:text-lg font-bold font-mono ${tone}`}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5 truncate">{label}</div>
    </div>
  );
}
