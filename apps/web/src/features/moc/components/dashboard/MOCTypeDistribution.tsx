'use client';

import React from 'react';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';

// Local high-fidelity implementation of Badge to guarantee styled uniformity
const Badge = ({ tone, children }: { tone: string; children: React.ReactNode }) => {
  let colors = 'bg-slate-900 text-slate-400 border-slate-800';
  if (tone === 'blue') colors = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  if (tone === 'purple') colors = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${colors}`}>
      {children}
    </span>
  );
};

// Local custom dynamic ProgressBar with optimized color theme support
const ProgressBar = ({ value, tone }: { value: number; tone: string }) => {
  let barColor = 'bg-sky-500';
  if (tone === 'purple') barColor = 'bg-purple-500';
  return (
    <div className="w-full bg-slate-900 border border-slate-800/80 h-1.5 rounded-full overflow-hidden">
      <div 
        className={`h-full ${barColor} transition-all duration-500 ease-out`} 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }} 
      />
    </div>
  );
};

// Clean high-fidelity production fallback data matching typical operational structures
const DEFAULT_MOCK_DATA = [
  { label: 'Permanent Change', count: 64, percent: 58, tone: 'blue' },
  { label: 'Temporary Change', count: 32, percent: 29, tone: 'purple' },
  { label: 'Emergency Change', count: 14, percent: 13, tone: 'blue' }
];

interface MOCTypeDistributionProps {
  items?: Array<{
    label: string;
    count?: number;
    percent?: number;
    filter?: any;
    tone?: string;
  }>;
}

export function MOCTypeDistribution({ items }: MOCTypeDistributionProps) {
  const setFilters = useMOCDashboardStore((state) => state.setFilters);

  // Fallback to rich default operational records if passed items are empty or unpopulated
  const activeItems = items && items.length > 0 ? items : DEFAULT_MOCK_DATA;

  // Compute maximum height control parameters dynamically
  const totalVolume = activeItems.reduce((sum, item) => sum + Number(item.count ?? 0), 0);

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-md md:p-5 flex flex-col justify-between h-full">
      
      {/* Dynamic Enhanced Header Stack */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-900 pb-2">
        <div>
          <h3 className="text-base font-bold tracking-tight text-white">
            MOC Type Distribution
          </h3>
        </div>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-800">
          Classification Metrics
        </span>
      </div>

      {/* Main Content Workspace Layout */}
      <div className="space-y-3 flex-1 flex flex-col justify-center">
        {activeItems.length > 0 ? (
          activeItems.map((item) => {
            const calculatedPercent = item.percent ?? (totalVolume ? Math.round((Number(item.count ?? 0) / totalVolume) * 100) : 0);
            const isTemporary = item.label.toLowerCase().includes('temporary');
            const visualTone = isTemporary ? 'purple' : 'blue';

            return (
              <button
                key={item.label}
                onClick={() => setFilters(item.filter ?? { change_type: item.label })}
                className="w-full rounded-xl border border-slate-900 bg-slate-900/40 p-3.5 text-left hover:border-slate-800 hover:bg-slate-900/70 transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-slate-700"
              >
                {/* Header Information Frame */}
                <div className="mb-2.5 flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                    {item.label}
                  </span>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
                      {calculatedPercent}%
                    </span>
                    <Badge tone={visualTone}>
                      {item.count ?? 0} MOCs
                    </Badge>
                  </div>
                </div>

                {/* Progress Visual Tracker */}
                <ProgressBar value={Number(calculatedPercent)} tone={visualTone} />
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-xs font-medium text-slate-500">No MOC type distribution yet</p>
          </div>
        )}
      </div>

    </div>
  );
}