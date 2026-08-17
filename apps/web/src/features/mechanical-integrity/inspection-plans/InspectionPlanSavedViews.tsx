'use client';

const views: Array<{ label: string; filters: Record<string, string> }> = [
  { label: 'All Plans', filters: {} },
  { label: 'Approved Plans', filters: { status: 'Approved' } },
  { label: 'Draft Plans', filters: { status: 'Draft' } },
  { label: 'Pending Review', filters: { status: 'Pending Review' } },
  { label: 'Due Soon', filters: { dueSoon: 'true' } },
  { label: 'Overdue', filters: { overdue: 'true' } },
  { label: 'CML/TML Plans', filters: { planType: 'CML/TML Inspection Plan' } },
  { label: 'Manual Override Plans', filters: { manualOverride: 'true' } },
  { label: 'Scheduler Errors', filters: { schedulerStatus: 'Calculation Error' } }
];

export function InspectionPlanSavedViews({ onSelect }: { onSelect: (filters: Record<string, string>) => void }) {
  return <div className="flex gap-2 overflow-x-auto pb-1">{views.map((view) => <button key={view.label} onClick={() => onSelect(view.filters)} className="shrink-0 rounded-full border border-[var(--psm-line)] px-3 py-1.5 text-xs font-semibold text-[var(--psm-text)] hover:bg-[var(--psm-surface-2)]">{view.label}</button>)}</div>;
}
