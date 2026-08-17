'use client';

const keys = [
  ['total', 'Total CMLs'], ['active', 'Active'], ['archived', 'Archived'], ['overdue', 'Overdue'], ['alertsOpen', 'Open Alerts'], ['lowRemainingLife', 'Low Remaining Life'], ['highestCorrosionRate', 'Highest Corrosion Rate'], ['nextDueDate', 'Next Due']
] as const;

export function CmlSummaryCards({ summary }: { summary?: Record<string, unknown> }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{keys.map(([key, label]) => <div key={key} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-[var(--psm-muted)]">{label}</p><p className="mt-2 text-2xl font-bold text-[var(--psm-text)]">{String(summary?.[key] ?? '-')}</p></div>)}</div>;
}
