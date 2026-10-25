'use client';

import React from 'react';

const categoryColors: Record<string, string> = {
  Information: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  'Hazard Analysis': 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  Operations: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  People: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  Integrity: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  Governance: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  Compliance: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  Custom: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30',
};

export function ExecutivePsmElementCategoryBadge({ category }: { category: string }) {
  const style = categoryColors[category] ?? 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30';
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${style}`}>
      {category}
    </span>
  );
}
