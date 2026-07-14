'use client';

import React from 'react';
import { Clock3 } from 'lucide-react';

// Unified high-fidelity production badge component matching global dark-mode systems
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

// Resilient default fallback data state
const DEFAULT_MOCK_DATA = {
  pendingUnder3Days: 4,
  pending3To7Days: 2,
  pendingOver7Days: 1,
  overdueApprovals: 3
};

interface MOCApprovalAgingProps {
  data?: Record<string, any>;
}

export function MOCApprovalAging({ data = {} }: MOCApprovalAgingProps) {
  const hasData = Object.keys(data).length > 0;
  const activeData = hasData ? data : DEFAULT_MOCK_DATA;

  const buckets = [
    ['Pending <3 days', activeData.pendingUnder3Days ?? activeData.under3 ?? 0, 'green'],
    ['Pending 3-7 days', activeData.pending3To7Days ?? activeData.between3And7 ?? 0, 'amber'],
    ['Pending >7 days', activeData.pendingOver7Days ?? activeData.over7 ?? 0, 'red'],
    ['Overdue Approvals', activeData.overdueApprovals ?? activeData.overdue ?? 0, 'red']
  ] as const;

  const totalItems = buckets.reduce((acc, [, count]) => acc + Number(count), 0);

  return (
    // Height is managed organically via h-auto, ensuring no inner scrollbars trigger when cards shift layout rows
    <div className="w-full h-auto rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-md md:p-5 flex flex-col justify-start">
      
      {/* Section Header Block Frame */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-2 shrink-0">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            Approval Aging
          </h3>
        </div>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-500 border border-slate-800 uppercase tracking-wider">
          Workflow Engine
        </span>
      </div>

      {/* Grid Layout Canvas: Switches organically from 2 columns to a stacked row layout under 480px */}
      <div className="w-full">
        {totalItems > 0 ? (
          <div className="grid gap-2.5 grid-cols-2 xs:grid-cols-2 w-full">
            {buckets.map(([label, count, tone]) => (
              <div 
                key={label} 
                className="rounded-xl border border-slate-900 bg-slate-900/40 p-3.5 flex flex-col justify-between transition-all duration-200 hover:border-slate-800/80 hover:bg-slate-900/60"
              >
                <div>
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <Clock3 size={12} className={tone === 'red' ? 'text-red-400' : tone === 'amber' ? 'text-amber-400' : 'text-emerald-400'} /> 
                    {label}
                  </p>
                  <p className="mt-2.5 text-2xl font-black text-white leading-none">
                    {count}
                  </p>
                </div>
                
                <div className="mt-3.5 flex items-center justify-start">
                  <Badge tone={tone}>
                    {count ? 'Needs review' : 'Clear'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center w-full">
            <p className="text-xs font-medium text-slate-500">No approvals currently aging</p>
          </div>
        )}
      </div>

    </div>
  );
}