'use client';

import { cn } from '@/utils/cn';

export function HazopRecommendationPriorityBadge({ value }: { value?: string }) {
  const priority = value ?? 'Medium';
  const tone = priority === 'Safety Critical' || priority === 'Critical'
    ? 'border-red-500/30 bg-red-500/10 text-red-300'
    : priority === 'High'
      ? 'border-orange-500/30 bg-orange-500/10 text-orange-300'
      : priority === 'Medium'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  return <span className={cn('rounded-md border px-2 py-1 text-xs font-semibold uppercase', tone)}>{priority}</span>;
}
