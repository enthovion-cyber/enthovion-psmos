'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarClock } from 'lucide-react';

// Unified local High-Fidelity implementation of Badge matching global styling constants
const Badge = ({ tone, children }: { tone: string; children: React.ReactNode }) => {
  let colors = 'bg-slate-900 text-slate-400 border-slate-800';
  if (tone === 'red') colors = 'bg-red-500/10 text-red-400 border-red-500/20';
  if (tone === 'amber') colors = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (tone === 'green') colors = 'bg-green-500/10 text-green-400 border-green-500/20';
  if (tone === 'blue') colors = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${colors}`}>
      {children}
    </span>
  );
};

// Unified local dynamic structural ProgressBar component
const ProgressBar = ({ value, tone }: { value: number; tone: string }) => {
  let barColor = 'bg-slate-500';
  if (tone === 'red') barColor = 'bg-red-500';
  if (tone === 'amber') barColor = 'bg-amber-400';
  if (tone === 'green') barColor = 'bg-green-500';
  return (
    <div className="w-full bg-slate-900 border border-slate-800/80 h-1.5 rounded-full overflow-hidden">
      <div 
        className={`h-full ${barColor} transition-all duration-300`} 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }} 
      />
    </div>
  );
};

// High-fidelity production fallback data matching industrial parameters (Updated to reflect year 2026 contexts)
const DEFAULT_MOCK_DATA = {
  summary: {
    active: 14,
    overdue: 2,
    expiringWithin30: 5,
    expiringWithin7: 1
  },
  items: [
    { id: 't1', mocNumber: 'MOC-2026-044', title: 'Temporary Nitrogen Purge Bypass Line', daysRemaining: -4, owner: 'J. Mitchell', expiryDate: '2026-06-30', normalizationRisk: true },
    { id: 't2', mocNumber: 'MOC-2026-092', title: 'Temporary Distillation Column Transmitter Swap', daysRemaining: 5, owner: 'A. Patel', expiryDate: '2026-07-09', normalizationRisk: false },
    { id: 't3', mocNumber: 'MOC-2026-105', title: 'Temporary Catalyst Feed Hose Connection', daysRemaining: 18, owner: 'S. Vance', expiryDate: '2026-07-22', normalizationRisk: false }
  ]
};

interface MOCTemporaryPanelProps {
  data?: Record<string, any>;
}

export function MOCTemporaryPanel({ data = {} }: MOCTemporaryPanelProps) {
  const items = data.items ?? data.expiring ?? (data.summary === undefined ? DEFAULT_MOCK_DATA.items : []);
  const summary = data.summary ?? (data.active !== undefined ? data : DEFAULT_MOCK_DATA.summary);
  
  const active = Number(summary.active ?? summary.activeCount ?? 0);
  const overdue = Number(summary.overdue ?? summary.overdueCount ?? 0);
  const expiring = Number(summary.expiringWithin30 ?? summary.expiringSoon ?? summary.expiringSoonCount ?? 0);

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-md md:p-5 flex flex-col h-full overflow-hidden">
      
      {/* Component Header Block - Kept static with shrink-0 */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-2 shrink-0">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            Temporary Change Control
          </h3>
        </div>
        <Badge tone={overdue ? 'red' : 'green'}>
          {overdue ? `${overdue} overdue` : 'Controlled'}
        </Badge>
      </div>

      {/* Main Content Area - Layout flex rules handle vertical expanding cleanly */}
      <div className="flex flex-col gap-4 w-full flex-1 justify-start overflow-hidden">
        
        {/* Dynamic Metric Grid Layout - Shrink protected */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 shrink-0">
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-2.5 sm:p-3 flex flex-col justify-between">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Active</p>
            <p className="text-xl font-black text-white mt-1">{active}</p>
          </div>
          
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-2.5 sm:p-3 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider">Expiring 30d</p>
              <p className="text-xl font-black text-amber-400 mt-1">{expiring}</p>
            </div>
            <p className="text-[9px] font-medium text-amber-500/70 mt-1 border-t border-slate-800/60 pt-1">
              7d critical: {summary.expiringWithin7 ?? 0}
            </p>
          </div>
          
          <div className="rounded-xl border border-slate-900 bg-slate-900/40 p-2.5 sm:p-3 flex flex-col justify-between">
            <p className="text-[10px] font-semibold text-red-400/80 uppercase tracking-wider">Overdue</p>
            <p className="text-xl font-black text-red-400 mt-1">{overdue}</p>
          </div>
        </div>

        {/* Workspace Timeline Row List - Height-stabilized via custom scroll behaviors */}
        <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {items.length ? (
            items.slice(0, 5).map((item: any) => {
              const days = Number(item.days_remaining ?? item.daysRemaining ?? 0);
              const statusTone = days < 0 ? 'red' : days <= 7 ? 'amber' : 'green';

              return (
                <Link
                  key={item.id ?? item.moc_id}
                  href={item.href ?? `/moc/${item.moc_id ?? item.mocId ?? item.id}`}
                  className="block rounded-xl border border-slate-900 bg-slate-950 p-3 hover:border-slate-800 hover:bg-slate-900/20 transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-slate-800"
                >
                  {/* Item Upper Flex Row */}
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="font-bold text-xs text-slate-200 group-hover:text-white transition-colors truncate max-w-[70%]">
                      {item.moc_number ?? item.mocNumber ?? item.title}
                    </p>
                    <Badge tone={statusTone}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                    </Badge>
                  </div>

                  {/* Responsive Meta Details Row */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-slate-400">
                    <span className="flex items-center gap-1 text-slate-500 group-hover:text-slate-400 transition-colors shrink-0">
                      <CalendarClock size={12} /> {item.owner ?? '-'}
                    </span>
                    <span className="text-slate-800">•</span>
                    <span>Exp: {item.expiryDate ?? item.expiry_date ?? '-'}</span>
                    <span className="text-slate-800">•</span>
                    <span className={item.normalizationRisk ? 'text-amber-400/80 font-semibold' : 'text-slate-500'}>
                      {item.normalizationRisk ? 'Normalization Risk' : 'Reversal Plan Tracked'}
                    </span>
                  </div>

                  {/* Exponential Visual Inversion Bar */}
                  <div className="mt-2.5">
                    <ProgressBar 
                      value={Math.max(5, Math.min(100, days < 0 ? 100 : 100 - (days * 2.5)))} 
                      tone={statusTone} 
                    />
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-xs font-medium text-slate-500">No temporary MOCs require attention</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}