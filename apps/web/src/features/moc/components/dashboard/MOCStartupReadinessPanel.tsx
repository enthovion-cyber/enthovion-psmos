'use client';

import React from 'react';
import Link from 'next/link';
import { Rocket } from 'lucide-react';

const Badge = ({ tone, children }: { tone: string; children: React.ReactNode }) => {
  let colors = 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)] border-[var(--psm-line)]';
  if (tone === 'red') colors = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
  if (tone === 'amber') colors = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  if (tone === 'green') colors = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${colors}`}>
      {children}
    </span>
  );
};

const ProgressBar = ({ value, tone }: { value: number; tone: string }) => {
  let barColor = 'bg-slate-500';
  if (tone === 'red') barColor = 'bg-red-500';
  if (tone === 'amber') barColor = 'bg-amber-400';
  if (tone === 'green') barColor = 'bg-emerald-500';
  return (
    <div className="w-full bg-[var(--psm-surface-2)] border border-[var(--psm-line)] h-2 rounded-full overflow-hidden">
      <div 
        className={`h-full ${barColor} transition-all duration-300`} 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }} 
      />
    </div>
  );
};

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
  data?: Record<string, any> | undefined;
}

export function MOCStartupReadinessPanel({ data = {} }: MOCStartupReadinessPanelProps) {
  const summary = data?.summary ?? (data?.requiringPssr !== undefined ? data : DEFAULT_MOCK_DATA.summary);
  const readiness = Number(data?.readinessRate ?? data?.completionRate ?? (summary?.requiringPssr ? Math.round((Number(summary.pssrComplete ?? 0) / Number(summary.requiringPssr)) * 100) : 100));
  const blocked = Number(summary?.startupBlocked ?? data?.blocked ?? data?.blockedCount ?? 0);
  const items = data?.items ?? data?.blockers ?? (data?.requiringPssr === undefined ? DEFAULT_MOCK_DATA.items : []);

  return (
    <div className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:p-5 flex flex-col justify-between h-full text-[var(--psm-fg)]">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)] pb-2 shrink-0">
        <h3 className="text-base font-bold tracking-tight text-[var(--psm-fg)]">
          PSSR / Startup Readiness
        </h3>
        <Badge tone={blocked ? 'amber' : 'green'}>
          {blocked ? `${blocked} blocked` : 'Ready queue clear'}
        </Badge>
      </div>

      <div className="flex flex-col gap-4 w-full flex-1 justify-start">
        <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5 shrink-0">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-bold text-[var(--psm-fg)]">
              <Rocket size={14} className="text-primary" /> General Queue Readiness
            </p>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{readiness}%</span>
          </div>
          <div className="mt-2.5">
            <ProgressBar value={readiness} tone={readiness > 85 ? 'green' : readiness > 60 ? 'amber' : 'red'} />
          </div>
        </div>

        <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
          {items.length ? (
            items.slice(0, 5).map((item: any) => (
              <Link 
                key={item.id ?? item.moc_id ?? item.mocId} 
                href={item.href ?? `/moc/${item.moc_id ?? item.mocId ?? item.id}`} 
                className="block rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 hover:border-primary/50 transition-all group focus:outline-none"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--psm-fg)] group-hover:text-primary transition-colors">
                    {item.mocNumber ?? item.moc_number}
                  </span>
                  <Badge tone={item.startupBlockersCount ? 'red' : 'green'}>
                    {item.startupBlockersCount ? `${item.startupBlockersCount} Blockers` : 'Clear'}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--psm-muted)]">{item.pssrStatus ?? 'Pending review'}</p>
              </Link>
            ))
          ) : (
            <p className="text-center text-xs text-[var(--psm-muted)] py-4">No pending startup reviews</p>
          )}
        </div>
      </div>
    </div>
  );
}
