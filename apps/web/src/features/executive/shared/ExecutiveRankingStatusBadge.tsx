'use client';

import React from 'react';

export function ExecutiveRankingStatusBadge({ status }: { status: string }) {
  const isHealthy = status === 'Healthy' || status === 'Top Performer' || status === 'Low Risk';
  const isWarning = status === 'Monitor' || status === 'Medium Risk' || status === 'Attention Required';
  const isCritical = status === 'Critical' || status === 'High Risk' || status === 'Worst Performer';

  const badgeStyle = isHealthy
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
    : isWarning
    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
    : isCritical
    ? 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30'
    : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30';

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeStyle}`}>
      {status}
    </span>
  );
}
