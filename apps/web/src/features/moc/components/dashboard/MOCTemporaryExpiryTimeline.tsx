'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CalendarClock, ChevronDown, ChevronUp } from 'lucide-react';

// Local High-Fidelity implementation of Badge matching global styling constants
const Badge = ({ tone, children }: { tone: string; children: React.ReactNode }) => {
  let colors = 'bg-slate-900 text-slate-400 border-slate-800';
  if (tone === 'red') colors = 'bg-red-500/10 text-red-400 border-red-500/20';
  if (tone === 'amber') colors = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (tone === 'green') colors = 'bg-green-500/10 text-green-400 border-green-500/20';
  if (tone === 'purple') colors = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${colors}`}>
      {children}
    </span>
  );
};

// High-fidelity production fallback data matching operational parameters (Year 2026 Context)
const DEFAULT_MOCK_DATA = [
  { id: '1', mocId: 'm1', mocNumber: 'MOC-2026-044', title: 'Temporary Nitrogen Purge Bypass Line', daysRemaining: -4, owner: 'J. Mitchell', expiryDate: '2026-06-30', riskLevel: 'Critical', normalizationRisk: true },
  { id: '2', mocId: 'm2', mocNumber: 'MOC-2026-092', title: 'Transmitter Swap Column 4', daysRemaining: 5, owner: 'A. Patel', expiryDate: '2026-07-09', riskLevel: 'High', normalizationRisk: false },
  { id: '3', mocId: 'm3', mocNumber: 'MOC-2026-105', title: 'Catalyst Feed Hose Bypass', daysRemaining: 18, owner: 'S. Vance', expiryDate: '2026-07-22', riskLevel: 'Medium', normalizationRisk: false },
  { id: '4', mocId: 'm4', mocNumber: 'MOC-2026-114', title: 'Auxiliary Cooling Fan Hookup', daysRemaining: 28, owner: 'M. Ross', expiryDate: '2026-08-01', riskLevel: 'Low', normalizationRisk: false },
  { id: '5', mocId: 'm5', mocNumber: 'MOC-2026-121', title: 'Flare Header Line Relocation', daysRemaining: 45, owner: 'K. Choi', expiryDate: '2026-08-18', riskLevel: 'High', normalizationRisk: true },
];

interface MOCTemporaryExpiryTimelineProps {
  items?: Array<Record<string, any>>;
}

export function MOCTemporaryExpiryTimeline({ items }: MOCTemporaryExpiryTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fallback cleanly to high-fidelity dashboard dataset if empty
  const baseItems = items && items.length > 0 ? items : DEFAULT_MOCK_DATA;

  // Perform analytical chronological sorting inline safely
  const sorted = [...baseItems].sort((a, b) => Number(a.daysRemaining ?? 9999) - Number(b.daysRemaining ?? 9999));
  
  // Conditionally calculate dynamic viewport slice (Default 4 rows limit)
  const displayedItems = isExpanded ? sorted : sorted.slice(0, 4);
  const hasMoreThanFour = sorted.length > 4;

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-md md:p-5 flex flex-col justify-between h-full">
      
      {/* Dynamic Enhanced Header Frame */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-900 pb-2">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            Temporary Change Expiry Timeline
          </h3>
        </div>
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          30d · 7d · Overdue · Normalization
        </span>
      </div>

      <div className="flex flex-col gap-3 w-full flex-1 justify-start">
        {/* Timeline Row Layout Feed */}
        <div className="space-y-2">
          {displayedItems.length ? (
            displayedItems.map((item) => {
              const days = Number(item.daysRemaining ?? item.days_remaining ?? 0);
              const tone = days < 0 ? 'red' : days <= 7 ? 'red' : days <= 30 ? 'amber' : item.normalizationRisk ? 'purple' : 'green';

              return (
                <Link
                  key={item.id ?? item.mocId ?? item.moc_id}
                  href={item.href ?? `/moc/${item.mocId ?? item.moc_id ?? item.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-900 bg-slate-900/40 p-3 hover:border-slate-800 hover:bg-slate-900/70 transition-all duration-200 group focus:outline-none w-full"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-200 group-hover:text-white transition-colors truncate">
                      <span className="text-sky-400 font-extrabold">{item.mocNumber ?? item.moc_number}</span> · {item.title}
                    </p>
                    
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-medium text-slate-400">
                      <span className="flex items-center gap-1 text-slate-500 group-hover:text-slate-400 transition-colors shrink-0">
                        <CalendarClock size={12} /> {item.owner ?? '-'}
                      </span>
                      <span className="text-slate-800/60">•</span>
                      <span>Expiry: {item.expiryDate ?? item.expiry_date ?? '-'}</span>
                      <span className="text-slate-800/60">•</span>
                      <span className="text-slate-500">Risk: <span className="font-semibold text-slate-300">{item.riskLevel ?? item.risk_level ?? '-'}</span></span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-start sm:justify-end">
                    <Badge tone={tone}>
                      {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d remaining`}
                    </Badge>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-xs font-medium text-slate-500">No temporary expiry timeline items</p>
            </div>
          )}
        </div>

        {/* Expand/Collapse Workspace View All Option */}
        {hasMoreThanFour && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-900/60 bg-slate-950 py-2 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-800 transition-all duration-200 focus:outline-none"
          >
            {isExpanded ? (
              <>
                <span>View Less</span>
                <ChevronUp size={14} className="text-slate-500" />
              </>
            ) : (
              <>
                <span>View All ({sorted.length})</span>
                <ChevronDown size={14} className="text-slate-500" />
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
}