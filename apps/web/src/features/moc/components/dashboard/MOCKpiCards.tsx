'use client';

import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock3, 
  Flame, 
  Gauge, 
  PauseCircle, 
  ShieldCheck, 
  TimerReset 
} from 'lucide-react';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';

const cards = [
  ['total', 'Open MOCs', 'blue', Gauge, {}],
  ['high-risk', 'High Risk', 'red', AlertTriangle, { risk_level: 'High' }],
  ['submitted', 'Pending Approval', 'amber', Clock3, { status: 'Submitted' }],
  ['overdue-actions', 'Overdue Actions', 'red', TimerReset, { overdue_actions: true }],
  ['temporary-active', 'Temporary Active', 'purple', PauseCircle, { is_temporary: true }],
  ['emergency-review', 'Emergency Reviews', 'red', Flame, { is_emergency: true }],
  ['startup-blockers', 'Startup Blocked', 'amber', ShieldCheck, { startup_blocked: true }],
  ['closed-month', 'Closed This Month', 'green', CheckCircle2, { status: 'Closed' }],
  ['critical-risk', 'Critical Risk', 'red', AlertTriangle, { risk_level: 'Critical' }],
  ['temporary-expiring', 'Temp Expiring Soon', 'amber', TimerReset, { expiring_within_days: 30, is_temporary: true }],
  ['temporary-overdue', 'Overdue Temporary', 'red', TimerReset, { overdue_temporary: true }],
  ['closure-blockers', 'Closure Blocked', 'red', ShieldCheck, { closure_blocked: true }],
  ['ready-startup', 'Ready For Startup', 'green', CheckCircle2, { status: 'Ready For Startup' }]
] as const;

// Enhanced high-fidelity token mappings for industrial tracking cards
const toneClasses: Record<string, { border: string; text: string; bg: string; glow: string }> = {
  blue: {
    border: 'border-slate-800 hover:border-blue-500/40',
    text: 'text-blue-400',
    bg: 'bg-blue-500/[0.01]',
    glow: 'group-hover:bg-blue-500/5'
  },
  red: {
    border: 'border-slate-800 hover:border-red-500/40',
    text: 'text-red-400',
    bg: 'bg-red-500/[0.01]',
    glow: 'group-hover:bg-red-500/5'
  },
  amber: {
    border: 'border-slate-800 hover:border-amber-500/40',
    text: 'text-amber-400',
    bg: 'bg-amber-500/[0.01]',
    glow: 'group-hover:bg-amber-500/5'
  },
  purple: {
    border: 'border-slate-800 hover:border-purple-500/40',
    text: 'text-purple-400',
    bg: 'bg-purple-500/[0.01]',
    glow: 'group-hover:bg-purple-500/5'
  },
  green: {
    border: 'border-slate-800 hover:border-green-500/40',
    text: 'text-green-400',
    bg: 'bg-green-500/[0.01]',
    glow: 'group-hover:bg-green-500/5'
  }
};

interface MOCKpiCardsProps {
  kpis?: Array<Record<string, any>>;
}

export function MOCKpiCards({ kpis = [] }: MOCKpiCardsProps) {
  const setFilters = useMOCDashboardStore((state) => state.setFilters);
  const rows = Array.isArray(kpis) ? kpis : [];
  const byId = Object.fromEntries(rows.map((row: any) => [row.id, row]));

  return (
    // Dynamic, fluid grid layout containing no hard minimum tracks. Adjusts height organically per breakpoint.
    <section className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 w-full">
      {cards.map(([key, label, tone, Icon, fallbackFilter]) => {
        const row: any = byId[key] ?? {};
        const activeTone = row.tone ?? tone;
        const config = toneClasses[activeTone] || toneClasses.blue;

        return (
          <button
            key={key}
            onClick={() => setFilters(row.filter ?? fallbackFilter)}
            className={`
              group 
              relative 
              flex 
              flex-col 
              justify-between
              rounded-xl 
              border 
              p-4 
              text-left 
              transition-all 
              duration-200 
              focus:outline-none 
              focus:ring-1 
              focus:ring-slate-800
              bg-slate-950
              w-full
              h-auto
              ${config.border}
              ${config.bg}
            `}
          >
            {/* Context Interactive Glow Layer */}
            <div className={`absolute inset-0 rounded-xl transition-colors duration-200 pointer-events-none ${config.glow}`} />

            {/* Core Card Layout Content Wrapper */}
            <div className="relative z-10 w-full flex flex-col justify-between h-full gap-3">
              
              {/* Top Meta Line */}
              <div className="flex w-full items-start justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 line-clamp-1 group-hover:text-slate-300 transition-colors">
                  {row.label ?? label}
                </span>
                <Icon className="text-slate-500 shrink-0 opacity-70 group-hover:opacity-100 group-hover:text-slate-400 transition-all duration-200" size={14} />
              </div>

              {/* Data Metric Value */}
              <div className="text-2xl font-black text-white leading-none tracking-tight my-1">
                {Number(row.count ?? 0).toLocaleString()}
              </div>

              {/* Informative Interaction Hint Subtext */}
              <div className={`text-[10px] font-bold uppercase tracking-wide transition-colors ${config.text}`}>
                Filter Register <span>→</span>
              </div>

            </div>
          </button>
        );
      })}
    </section>
  );
}