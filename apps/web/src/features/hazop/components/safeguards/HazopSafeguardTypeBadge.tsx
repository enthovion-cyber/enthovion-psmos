import { cn } from '@/utils/cn';

export function HazopSafeguardTypeBadge({ value }: { value?: string }) {
  const type = value ?? 'Other';
  const tone = type.includes('SIS') || type.includes('SIF') || type.includes('ESD') || type.includes('Interlock')
    ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
    : type.includes('PSV') || type.includes('Mechanical')
      ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
      : type.includes('Administrative') || type.includes('Procedure') || type.includes('Training')
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        : 'border-slate-500/30 bg-slate-500/10 text-slate-300';
  return <span className={cn('rounded-md border px-2 py-1 text-xs font-semibold uppercase', tone)}>{type}</span>;
}
