'use client';

export function HazopAttendanceBadge({ value }: { value?: string | number | null | undefined }) {
  const text = typeof value === 'number' ? `${value}%` : value ?? 'Not tracked';
  const pct = typeof value === 'number' ? value : Number.parseInt(String(value ?? '0'), 10);
  const tone = pct >= 90 || ['Present', 'Complete'].includes(String(value)) ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : pct >= 60 || ['Partial', 'Excused'].includes(String(value)) ? 'border-amber-400/40 bg-amber-500/15 text-amber-200' : 'border-red-400/40 bg-red-500/15 text-red-200';
  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${tone}`}>{text}</span>;
}
