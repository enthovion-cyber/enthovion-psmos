'use client';

import React from 'react';
import { useMOCDashboardStore } from '../../stores/moc-dashboard.store';

const Badge = ({ tone, children }: { tone: string; children: React.ReactNode }) => {
  let colors = 'bg-[var(--psm-surface-2)] text-[var(--psm-muted)] border-[var(--psm-line)]';
  if (tone === 'blue') colors = 'bg-primary/10 text-primary border-primary/20';
  if (tone === 'purple') colors = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide whitespace-nowrap ${colors}`}>
      {children}
    </span>
  );
};

const ProgressBar = ({ value, tone }: { value: number; tone: string }) => {
  let barColor = 'bg-primary';
  if (tone === 'purple') barColor = 'bg-purple-500';
  return (
    <div className="w-full bg-[var(--psm-surface-2)] border border-[var(--psm-line)] h-1.5 rounded-full overflow-hidden">
      <div 
        className={`h-full ${barColor} transition-all duration-500 ease-out`} 
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }} 
      />
    </div>
  );
};

const DEFAULT_MOCK_DATA = [
  { label: 'Permanent Change', count: 64, percent: 58, tone: 'blue' },
  { label: 'Temporary Change', count: 32, percent: 29, tone: 'purple' },
  { label: 'Emergency Change', count: 14, percent: 13, tone: 'blue' }
];

interface MOCTypeDistributionProps {
  items?: Array<Record<string, any>> | undefined;
}

export function MOCTypeDistribution({ items }: MOCTypeDistributionProps) {
  const setFilters = useMOCDashboardStore((state) => state.setFilters);
  const activeItems: Array<Record<string, any>> = items && items.length > 0 ? items : DEFAULT_MOCK_DATA;
  const totalVolume = activeItems.reduce((sum, item) => sum + Number(item.count ?? 0), 0);

  return (
    <div className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm md:p-5 flex flex-col justify-between h-full text-[var(--psm-fg)]">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--psm-line)] pb-2">
        <h3 className="text-base font-bold tracking-tight text-[var(--psm-fg)]">
          MOC Type Distribution
        </h3>
        <span className="rounded-full bg-[var(--psm-surface-2)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--psm-muted)] border border-[var(--psm-line)]">
          Classification Metrics
        </span>
      </div>

      <div className="space-y-3 flex-1 flex flex-col justify-center">
        {activeItems.length > 0 ? (
          activeItems.map((item) => {
            const calculatedPercent = item.percent ?? (totalVolume ? Math.round((Number(item.count ?? 0) / totalVolume) * 100) : 0);
            const isTemporary = String(item.label || '').toLowerCase().includes('temporary');
            const visualTone = isTemporary ? 'purple' : 'blue';

            return (
              <button
                key={item.label}
                onClick={() => setFilters(item.filter ?? { change_type: item.label })}
                className="w-full rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3.5 text-left hover:border-primary/50 transition-all group focus:outline-none"
              >
                <div className="mb-2.5 flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-[var(--psm-fg)] group-hover:text-primary transition-colors truncate">
                    {item.label}
                  </span>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium text-[var(--psm-muted)] group-hover:text-[var(--psm-fg)] transition-colors">
                      {calculatedPercent}%
                    </span>
                    <Badge tone={visualTone}>
                      {item.count ?? 0} MOCs
                    </Badge>
                  </div>
                </div>

                <ProgressBar value={Number(calculatedPercent)} tone={visualTone} />
              </button>
            );
          })
        ) : null}
      </div>
    </div>
  );
}
