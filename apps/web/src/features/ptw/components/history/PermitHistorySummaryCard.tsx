'use client';

import { Activity, AlertTriangle, CalendarClock, Clock, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PermitHistorySummary } from '../../services/ptw-history.service';

export function PermitHistorySummaryCard({ summary }: { summary?: PermitHistorySummary | undefined }) {
  const items = [
    { label: 'Total Events', value: summary?.totalEvents ?? 0, icon: Activity, tone: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { label: 'Lifecycle Events', value: summary?.lifecycleEvents ?? 0, icon: Clock, tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Safety Critical', value: summary?.safetyCriticalEvents ?? 0, icon: AlertTriangle, tone: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { label: 'Permit Age', value: `${summary?.permitAgeDays ?? 0}d`, icon: CalendarClock, tone: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
  ];

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900 p-5 shadow-2xl backdrop-blur-md text-slate-100">
      
      {/* Premium Upper Summary Information Matrix */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/60 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            History Summary
          </h3>
          <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
            Complete chronological permit record across PTW modules.
          </p>
        </div>
        <div className="inline-flex items-center justify-center rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-bold tracking-wide uppercase text-slate-300 self-start sm:self-auto">
          {summary?.currentStatus ?? 'Loading'}
        </div>
      </div>

      {/* Primary Analytical Highlight Matrix Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(({ label, value, icon: Icon, tone }) => (
          <div 
            key={label} 
            className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 transition-colors hover:bg-slate-950/80"
          >
            <div className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>
              <Icon size={13} /> 
              <span>{label}</span>
            </div>
            <div className="mt-3 text-2xl font-semibold font-mono tracking-tight text-slate-200">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Sub-Informational Footprint System Audit Row Grid */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Info 
          icon={<Activity size={14} className="text-sky-400" />} 
          label="Last Event" 
          value={summary?.lastEvent ?? '-'} 
        />
        <Info 
          icon={<UserRound size={14} className="text-purple-400" />} 
          label="Last Updated By" 
          value={summary?.lastUpdatedBy ?? '-'} 
        />
        <Info 
          icon={<Clock size={14} className="text-emerald-400" />} 
          label="Last Updated At" 
          value={summary?.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleString() : '-'} 
        />
      </div>
    </section>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-950/30 p-3 text-xs transition-colors hover:bg-slate-950/60">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1.5 font-semibold text-slate-300 truncate max-w-full" title={value}>
        {value}
      </div>
    </div>
  );
}