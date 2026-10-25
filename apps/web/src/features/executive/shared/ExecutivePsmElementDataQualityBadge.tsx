'use client';

import React from 'react';

const qualityStyles: Record<string, string> = {
  Current: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  High: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  Moderate: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  Low: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
  Stale: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
  'Insufficient Data': 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30',
};

export function ExecutivePsmElementDataQualityBadge({ quality }: { quality: string }) {
  const style = qualityStyles[quality] ?? 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30';
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${style}`}>
      {quality}
    </span>
  );
}
