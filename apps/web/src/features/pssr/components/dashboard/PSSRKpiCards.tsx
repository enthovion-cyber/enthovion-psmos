'use client';

import { useState } from 'react';
import { 
  ClipboardCheck, 
  FileWarning, 
  AlertTriangle, 
  CheckCircle2, 
  LockKeyhole, 
  Rocket,
  ChevronDown,
  ChevronUp,
  Grid
} from 'lucide-react';

const icons = [ClipboardCheck, FileWarning, AlertTriangle, CheckCircle2, LockKeyhole, Rocket];

interface KpiItem {
  label: string;
  value?: number | string;
  description?: string;
  tone?: 'slate' | 'amber' | 'red' | 'green' | 'blue' | 'purple' | string;
  filter?: Record<string, any>;
}

export function PSSRKpiCards({ 
  kpis = [], 
  onFilter 
}: { 
  kpis: KpiItem[]; 
  onFilter: (filter: Record<string, any>) => void; 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Enforce exactly 4 items on the primary row, dynamic toggle for the rest on the same page
  const visibleKpis = isExpanded ? kpis : kpis.slice(0, 7);
  const hasMoreItems = kpis.length > 7;

  // Ultra high-end modern glassmorphic glows and vector accent tones
  const getThemeMapping = (tone?: string) => {
    switch (tone) {
      case 'amber':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
          glow: 'from-amber-500/5 via-transparent to-transparent',
          borderHover: 'hover:border-amber-500/40'
        };
      case 'red':
        return {
          badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
          glow: 'from-rose-500/5 via-transparent to-transparent',
          borderHover: 'hover:border-rose-500/40'
        };
      case 'green':
        return {
          badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
          glow: 'from-emerald-500/5 via-transparent to-transparent',
          borderHover: 'hover:border-emerald-500/40'
        };
      case 'blue':
        return {
          badge: 'bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.15)]',
          glow: 'from-sky-500/5 via-transparent to-transparent',
          borderHover: 'hover:border-sky-500/40'
        };
      default:
        return {
          badge: 'bg-slate-800/80 text-slate-300 border border-slate-700/60 shadow-[0_0_15px_rgba(148,163,184,0.05)]',
          glow: 'from-slate-500/5 via-transparent to-transparent',
          borderHover: 'hover:border-slate-600/40'
        };
    }
  };

  return (
    <div className="space-y-5">
      {/* Premium Dashboard Grid Matrix */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
        {visibleKpis.map((item, index) => {
          const Icon = icons[index % icons.length];
          const themes = getThemeMapping(item.tone);

          return (
            <button
              key={item.label}
              onClick={() => onFilter(item.filter ?? {})}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border border-cyan-500/10 bg-slate-950/40 p-5 text-left backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all duration-300 hover:-translate-y-1 ${themes.borderHover} hover:shadow-sky-950/20 focus:outline-none`}
            >
              {/* Radial Ambient Backglow effect */}
              <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-radial to-60% ${themes.glow} blur-2xl transition-opacity duration-300 group-hover:opacity-100`} />

              {/* Top Row: KPI Details & Premium Badge */}
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    {item.label}
                  </p>
                  <p className="text-3xl font-black tracking-tight text-white transition-colors duration-300 group-hover:text-sky-300">
                    {item.value ?? 0}
                  </p>
                </div>

                {/* Pro Tier Tech-Badge */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${themes.badge}`}>
                  <Icon size={25} strokeWidth={2.2} />
                </div>
              </div>

              {/* Bottom Row: Context Description */}
              {item.description && (
                <div className="relative z-10 mt-5 border-t border-slate-900/40 pt-3">
                  <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-500 transition-colors duration-300 group-hover:text-slate-300">
                    {item.description}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </section>

      {/* View Toggle Controller - Updates strictly inside the current view context */}
      {hasMoreItems && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2.5 rounded-xl border border-cyan-500/10 bg-slate-950/50 px-4 py-2.5 text-xs font-semibold tracking-wide text-sky-400 backdrop-blur-md shadow-lg transition-all duration-300 hover:border-sky-500/30 hover:bg-slate-900/60 hover:text-sky-300"
          >
            <Grid size={13} className="text-sky-500" />
            <span>{isExpanded ? 'Collapse Matrix' : 'View All Metrics'}</span>
            <div className="flex items-center justify-center rounded-md bg-sky-500/10 p-0.5 text-sky-400">
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}