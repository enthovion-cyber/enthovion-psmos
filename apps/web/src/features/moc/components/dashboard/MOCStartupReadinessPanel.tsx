'use client';

import React from 'react';
import Link from 'next/link';
import { Rocket, ShieldCheck } from 'lucide-react';

// Local High-Fidelity implementation of Badge matching global styling constants
const Badge = ({ tone, children }: { tone: string; children: React.ReactNode }) => {
  let colors = 'bg-slate-900 text-slate-400 border-slate-800';
  if (tone === 'red') colors = 'bg-red-500/10 text-red-400 border-red-500/20';
  if (tone === 'amber') colors = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (tone === 'green') colors = 'bg-green-500/10 text-green-400 border-green-500/20';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${colors}`}>
      {children}
    </span>
  );
};

// Local dynamic framework ProgressBar component
const ProgressBar = ({ value, tone }: { value: number; tone: string }) => {
  let barColor = 'bg-slate-500';
  if (tone === 'red') barColor = 'bg-red-500';
  if (tone === 'amber') barColor = 'bg-amber-400';
  if (tone === 'green') barColor = 'bg-emerald-400';
  return (
    <div className="w-full bg-slate-900 border border-slate-800/80 h-2 rounded-full overflow-hidden">
      <div 
        className={`h-full ${barColor} transition-all duration-300`} 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }} 
      />
    </div>
  );
};

// Clean high-fidelity production fallback data matching typical operational structures
const DEFAULT_MOCK_DATA = {
  summary: {
    requiringPssr: 6,
    pssrComplete: 4,
    startupBlocked: 2
  },
  items: [
    { id: 'p1', mocNumber: 'MOC-2026-078', pssrStatus: 'PSSR Pending', startupBlockersCount: 2, trainingReadiness: 80, engineeringReadiness: 95, requiredActionsBeforeStartup: 3 },
    { id: 'p2', mocNumber: 'MOC-2026-102', pssrStatus: 'Pre-Commissioning', startupBlockersCount: 1, trainingReadiness: 100, engineeringReadiness: 90, requiredActionsBeforeStartup: 1 },
    { id: 'p3', mocNumber: 'MOC-2026-115', pssrStatus: 'Sign-off Needed', startupBlockersCount: 0, trainingReadiness: 100, engineeringReadiness: 100, requiredActionsBeforeStartup: 0 }
  ]
};

interface MOCStartupReadinessPanelProps {
  data?: Record<string, any>;
}

export function MOCStartupReadinessPanel({ data = {} }: MOCStartupReadinessPanelProps) {
  // Defensive fallbacks merging direct schema variants
  const summary = data.summary ?? (data.requiringPssr !== undefined ? data : DEFAULT_MOCK_DATA.summary);
  const readiness = Number(data.readinessRate ?? data.completionRate ?? (summary.requiringPssr ? Math.round((Number(summary.pssrComplete ?? 0) / Number(summary.requiringPssr)) * 100) : 100));
  const blocked = Number(summary.startupBlocked ?? data.blocked ?? data.blockedCount ?? 0);
  const items = data.items ?? data.blockers ?? (data.requiringPssr === undefined ? DEFAULT_MOCK_DATA.items : []);

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-md md:p-5 flex flex-col justify-between h-full">
      
      {/* Component Header Block */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-2 shrink-0">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            PSSR / Startup Readiness
          </h3>
        </div>
        <Badge tone={blocked ? 'amber' : 'green'}>
          {blocked ? `${blocked} blocked` : 'Ready queue clear'}
        </Badge>
      </div>

      {/* Main Responsive Grid Layout Container */}
      <div className="flex flex-col gap-4 w-full flex-1 justify-start">
        
        {/* Core Global Readiness Metric Block */}
        <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-3.5 shrink-0">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Rocket size={14} className="text-sky-400" /> General Queue Readiness
            </p>
            <span className="text-xl font-black text-emerald-400 leading-none">{readiness}%</span>
          </div>
          <div className="mt-2.5">
            <ProgressBar value={readiness} tone={readiness > 85 ? 'green' : readiness > 60 ? 'amber' : 'red'} />
          </div>
        </div>

        {/* Scroll/Height-Stabilized Card List Workspace */}
        <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {items.length ? (
            items.slice(0, 5).map((item: any) => (
              <Link 
                key={item.id ?? item.moc_id ?? item.mocId} 
                href={item.href ?? `/moc/${item.moc_id ?? item.mocId ?? item.id}`} 
                className="block rounded-xl border border-slate-900 bg-slate-950 p-3 hover:border-slate-800 hover:bg-slate-900/30 transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-slate-800"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-bold text-xs text-slate-200 group-hover:text-white transition-colors truncate max-w-[70%]">
                    {item.moc_number ?? item.mocNumber ?? item.title}
                  </p>
                  <Badge tone={item.startupBlockersCount ? 'red' : 'amber'}>
                    {item.pssrStatus ?? item.blocker_type ?? item.blockerType ?? 'Startup readiness'}
                  </Badge>
                </div>

                {/* Subtext Operations Metadata Grid Line */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-slate-400">
                  <span className="flex items-center gap-1 text-slate-500 group-hover:text-slate-400 transition-colors shrink-0">
                    <ShieldCheck size={12} /> Blockers: <span className={item.startupBlockersCount ? 'text-red-400 font-bold' : 'text-slate-400'}>{item.startupBlockersCount ?? 0}</span>
                  </span>
                  <span className="text-slate-800">•</span>
                  <span>Training: {item.trainingReadiness ?? 100}%</span>
                  <span className="text-slate-800">•</span>
                  <span>Eng: {item.engineeringReadiness ?? 0}%</span>
                  <span className="text-slate-800">•</span>
                  <span>Actions: {item.requiredActionsBeforeStartup ?? 0}</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-xs font-medium text-slate-500">No startup blockers</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}