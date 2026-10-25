'use client';

import React from 'react';
import type { PsmElementStatus } from '../types/executive-psm-element.types';

const statusStyles: Record<string, string> = {
  Healthy: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  Monitor: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
  'Attention Required': 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  'High Risk': 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
  Critical: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
  'Incomplete Data': 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
  'Insufficient Data': 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
  Restricted: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
  'Source Unavailable': 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
  'Not Configured': 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
};

export function ExecutivePsmElementStatusBadge({ status }: { status: PsmElementStatus | string }) {
  const badgeStyle = statusStyles[status] ?? 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}>
      {status}
    </span>
  );
}
