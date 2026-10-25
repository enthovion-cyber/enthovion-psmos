'use client';

import React from 'react';
import type { ExecutiveHeatmapCellStatus } from '../types/executive-performance.types';

const cellStyles: Record<ExecutiveHeatmapCellStatus, string> = {
  Healthy: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
  Monitor: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
  Warning: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/40',
  'High Risk': 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40',
  Critical: 'bg-red-500/25 text-red-700 dark:text-red-300 border-red-500/40',
  Restricted: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40',
  Unavailable: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
  'Insufficient Data': 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
};

export function ExecutiveHeatmapCellStatusBadge({ status }: { status: ExecutiveHeatmapCellStatus }) {
  const badgeStyle = cellStyles[status] ?? 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${badgeStyle}`}
    >
      {status}
    </span>
  );
}

export { ExecutiveHeatmapCellStatusBadge as HeatmapCellStatusBadge };
