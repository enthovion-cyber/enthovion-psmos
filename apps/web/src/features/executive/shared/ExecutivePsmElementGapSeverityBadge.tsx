'use client';

import React from 'react';

const severityStyles: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  high: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  low: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
};

export function ExecutivePsmElementGapSeverityBadge({ severity }: { severity: string }) {
  const normalized = severity.toLowerCase();
  const style = severityStyles[normalized] ?? 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${style}`}>
      {severity}
    </span>
  );
}
