'use client';

import React from 'react';
import Link from 'next/link';
import { ExecutivePsmElementStatusBadge } from '../shared/ExecutivePsmElementStatusBadge';

interface Props {
  cells: Array<{
    elementId: string;
    elementName: string;
    score: number | null;
    status: string;
    criticalCount: number;
    overdueCount: number;
    restricted: boolean;
    drilldownRoute: string;
  }>;
}

export function ExecutivePsmElementHeatmapGrid({ cells = [] }: Props) {
  const getCellBg = (status: string) => {
    switch (status) {
      case 'Healthy':
        return 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
      case 'Monitor':
        return 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-800 dark:text-blue-300 border-blue-500/30';
      case 'Attention Required':
        return 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border-amber-500/30';
      case 'High Risk':
        return 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-800 dark:text-orange-300 border-orange-500/30';
      case 'Critical':
        return 'bg-red-500/25 hover:bg-red-500/35 text-red-800 dark:text-red-300 border-red-500/40';
      case 'Restricted':
        return 'bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-500/30';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  if (!cells.length) {
    return (
      <div className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-12 text-center text-sm text-[var(--psm-muted)]">
        No PSM element heatmap data available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] shadow-sm">
      <div className="border-b border-[var(--psm-line)] p-4 sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--psm-text)]">PSM Elements Risk & Health Density Heatmap</h2>
          <p className="mt-1 text-xs text-[var(--psm-muted)]">
            Distribution of governance health across all 20 standard Process Safety Management elements.
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs sm:mt-0">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500/30 border border-emerald-500/50" /> Healthy</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-500/30 border border-blue-500/50" /> Monitor</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-500/30 border border-amber-500/50" /> Attention Req.</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500/30 border border-red-500/50" /> Critical</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {cells.map((cell) => {
          const bg = getCellBg(cell.status);
          return (
            <Link
              key={cell.elementId}
              href={cell.drilldownRoute || `/executive/psm-elements/${cell.elementId}`}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-all hover:scale-[1.02] ${bg}`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {cell.status}
                </span>
                <h4 className="mt-1 font-bold text-sm text-[var(--psm-text)] line-clamp-2">
                  {cell.elementName}
                </h4>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--psm-text)]">
                  {cell.restricted ? '🔒' : cell.score != null ? cell.score : '—'}
                </span>
                <span className="text-[11px] font-medium opacity-80">
                  {cell.criticalCount > 0 ? `${cell.criticalCount} Critical` : `${cell.overdueCount} Overdue`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
