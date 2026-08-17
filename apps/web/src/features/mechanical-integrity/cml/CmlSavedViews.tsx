'use client';

const views = [
  ['all', 'All CMLs', {}],
  ['active', 'Active CMLs', { activeOnly: 'true' }],
  ['no-readings', 'No Readings', { noReading: 'true' }],
  ['below-alert', 'Below Alert', { belowAlert: 'true' }],
  ['below-tmin', 'Below Tmin', { belowMinimum: 'true' }],
  ['overdue', 'Overdue', { overdue: 'true' }],
  ['pending-review', 'Pending Review', { pendingReview: 'true' }],
  ['archived', 'Archived', { archived: 'true' }]
] as const;

export function CmlSavedViews({ onSelect }: { onSelect: (filters: Record<string, string>) => void }) {
  return <div className="flex gap-2 overflow-x-auto rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-3 shadow-sm">{views.map(([key, label, filters]) => <button key={key} className="min-w-max rounded-lg border border-[var(--psm-line)] px-3 py-2 text-xs font-bold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]" onClick={() => onSelect(filters)}>{label}</button>)}</div>;
}
