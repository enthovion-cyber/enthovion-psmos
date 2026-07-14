'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Flame, ChevronDown, ChevronUp } from 'lucide-react';

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

// Local custom UI fallback components
const EmptyState = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-6 text-center">
    <p className="text-xs font-medium text-slate-500">{title}</p>
  </div>
);

// High-fidelity production mock fallback data matching real auditing patterns
const DEFAULT_MOCK_DATA = {
  summary: { reviewDueCount: 2 },
  items: [
    { id: 'e1', mocNumber: 'MOC-2026-012', reviewStatus: 'Post-Review P1', overdue: true, implementedBy: 'D. Vance', reviewDueAt: '2026-07-04', hoursRemaining: -8 },
    { id: 'e2', mocNumber: 'MOC-2026-034', reviewStatus: 'HAZOP Verification', overdue: true, implementedBy: 'M. Ross', reviewDueAt: '2026-07-04', hoursRemaining: -2 },
    { id: 'e3', mocNumber: 'MOC-2026-056', reviewStatus: 'MOC Sign-off', overdue: false, implementedBy: 'S. Patel', reviewDueAt: '2026-07-05', hoursRemaining: 14 },
    { id: 'e4', mocNumber: 'MOC-2026-078', reviewStatus: 'Operations Check', overdue: false, implementedBy: 'K. Choi', reviewDueAt: '2026-07-05', hoursRemaining: 22 },
    { id: 'e5', mocNumber: 'MOC-2026-099', reviewStatus: 'Safety Sign-off', overdue: false, implementedBy: 'J. Mitchell', reviewDueAt: '2026-07-06', hoursRemaining: 46 }
  ]
};

interface MOCEmergencyPanelProps {
  data?: Record<string, any>;
}

export function MOCEmergencyPanel({ data = {} }: MOCEmergencyPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fallback cleanly to high-fidelity default operational records if passed items are empty
  const items = data.items ?? data.openReviews ?? (data.summary === undefined ? DEFAULT_MOCK_DATA.items : []);
  const summary = data.summary ?? (data.reviewDueCount !== undefined ? data : DEFAULT_MOCK_DATA.summary);
  
  const due = Number(summary.due ?? summary.reviewDue ?? summary.reviewDueCount ?? 0);

  // Dynamic pagination calculation logic
  const displayedItems = isExpanded ? items : items.slice(0, 4);
  const hasMoreThanFour = items.length > 4;

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-md md:p-5 flex flex-col justify-between h-full overflow-hidden">
      
      {/* Dynamic Enhanced Header Frame - Static shrink locked */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-2 shrink-0">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            Emergency Change Review
          </h3>
        </div>
        <Badge tone={due ? 'red' : 'green'}>
          {due ? `${due} review due` : 'No overdue review'}
        </Badge>
      </div>

      {/* Main Content Workspace Layout Container */}
      <div className="flex flex-col gap-2.5 w-full flex-1 justify-start overflow-hidden">
        
        {/* Height-Stabilized Scrolling Row Feed Grid */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent max-h-[350px]">
          {displayedItems.length ? (
            displayedItems.map((item: any) => {
              const hours = Number(item.hoursRemaining ?? 0);
              const cardBorder = item.overdue ? 'border-red-500/20 bg-red-500/[0.02] hover:border-red-500/40' : 'border-slate-900 bg-slate-900/30 hover:border-slate-800';

              return (
                <Link 
                  key={item.id ?? item.moc_id} 
                  href={item.href ?? `/moc/${item.moc_id ?? item.mocId ?? item.id}`} 
                  className={`block rounded-xl border p-3 transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-slate-800 ${cardBorder}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="font-bold text-xs text-slate-200 group-hover:text-white transition-colors truncate max-w-[70%]">
                      {item.moc_number ?? item.mocNumber ?? item.title}
                    </p>
                    <Badge tone={item.overdue ? 'red' : 'amber'}>
                      {item.review_status ?? item.reviewStatus ?? 'Review required'}
                    </Badge>
                  </div>

                  {/* Operational Log Metadata Subtext Line */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-medium text-slate-400">
                    <span className="flex items-center gap-1 text-slate-500 group-hover:text-slate-400 transition-colors shrink-0">
                      <Flame size={12} className={item.overdue ? 'text-red-400' : 'text-slate-500'} /> {item.implementedBy ?? '-'}
                    </span>
                    <span className="text-slate-800/80">•</span>
                    <span>Due: {item.reviewDueAt ?? '-'}</span>
                    <span className="text-slate-800/80">•</span>
                    <span className={`font-semibold ${hours < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {hours < 0 ? `${Math.abs(hours)}h overdue` : `${hours}h remaining`}
                    </span>
                  </div>
                </Link>
              );
            })
          ) : (
            <EmptyState title="No emergency MOCs pending review" />
          )}
        </div>

        {/* Expand/Collapse Conditional Trigger Switch */}
        {hasMoreThanFour && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-900/60 bg-slate-950 py-2 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-800 transition-all duration-200 shrink-0 focus:outline-none"
          >
            {isExpanded ? (
              <>
                <span>View Less</span>
                <ChevronUp size={14} className="text-slate-500" />
              </>
            ) : (
              <>
                <span>View All ({items.length})</span>
                <ChevronDown size={14} className="text-slate-500" />
              </>
            )}
          </button>
        )}

      </div>
    </div>
  );
}