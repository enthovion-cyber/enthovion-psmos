'use client';

import React from 'react';

export interface ComparisonItem {
  label: string;
  baselineValue: number;
  comparisonValue: number;
  unit?: string;
  comparable?: boolean;
  notes?: string;
}

interface Props {
  title?: string;
  subtitle?: string;
  baselineLabel?: string;
  comparisonLabel?: string;
  items: ComparisonItem[];
}

export function ExecutiveTrendComparisonBarChart({
  title = 'Cross-Site Performance Comparison',
  subtitle = 'Normalized KPI variance comparison across operating sites and scope boundaries.',
  baselineLabel = 'Baseline Period',
  comparisonLabel = 'Current Period',
  items = [],
}: Props) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-6 text-center text-xs text-[var(--psm-muted)]">
        No comparative observations available for selected scope.
      </div>
    );
  }

  const allVals = items.flatMap((it) => [it.baselineValue, it.comparisonValue]);
  const maxVal = Math.max(1, ...allVals);

  return (
    <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-1 border-b border-[var(--psm-line)] pb-3">
        <h3 className="text-base font-bold text-[var(--psm-text)]">{title}</h3>
        <p className="text-xs text-[var(--psm-muted)]">{subtitle}</p>
        <div className="mt-2 flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-zinc-400" />
            <span className="text-[var(--psm-muted)]">{baselineLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[var(--psm-primary)]" />
            <span className="text-[var(--psm-text)]">{comparisonLabel}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {items.map((item, idx) => {
          const delta = item.comparisonValue - item.baselineValue;
          const pctChange =
            item.baselineValue !== 0
              ? ((delta / Math.abs(item.baselineValue)) * 100).toFixed(1)
              : null;
          const isHigher = delta > 0;

          const baseWidth = Math.max(2, Math.round((item.baselineValue / maxVal) * 100));
          const compWidth = Math.max(2, Math.round((item.comparisonValue / maxVal) * 100));

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--psm-text)]">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[var(--psm-muted)]">
                    {item.baselineValue} → {item.comparisonValue} {item.unit || ''}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      isHigher ? 'text-emerald-500' : delta < 0 ? 'text-rose-500' : 'text-zinc-400'
                    }`}
                  >
                    {isHigher ? '+' : ''}
                    {delta.toFixed(1)} {pctChange ? `(${pctChange}%)` : ''}
                  </span>
                  {item.comparable === false && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-500" title="Different denominator or exposure basis">
                      Comparability Caveat
                    </span>
                  )}
                </div>
              </div>

              {/* Stacked comparison bars */}
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-[var(--psm-surface-2)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-zinc-400"
                    style={{ width: `${baseWidth}%` }}
                  />
                </div>
                <div className="h-2.5 w-full rounded-full bg-[var(--psm-surface-2)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--psm-primary)]"
                    style={{ width: `${compWidth}%` }}
                  />
                </div>
              </div>

              {item.notes && (
                <p className="text-[10px] text-[var(--psm-muted)] italic">{item.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
