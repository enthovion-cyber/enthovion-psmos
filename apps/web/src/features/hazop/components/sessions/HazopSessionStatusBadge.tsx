'use client';

export function HazopSessionStatusBadge({ value }: { value?: string | null }) {
  const status = value ?? 'Planned';
  const tone = status === 'Completed' ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200' : status === 'In Progress' ? 'border-blue-400/40 bg-blue-500/15 text-blue-200' : ['Cancelled', 'Missed'].includes(status) ? 'border-red-400/40 bg-red-500/15 text-red-200' : status === 'Rescheduled' ? 'border-amber-400/40 bg-amber-500/15 text-amber-200' : 'border-[var(--psm-line)] bg-[var(--psm-surface-2)] text-[var(--psm-muted)]';
  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${tone}`}>{status}</span>;
}
