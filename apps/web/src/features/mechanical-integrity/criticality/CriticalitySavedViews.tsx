export function CriticalitySavedViews({ onSelect }: { onSelect: (filters: Record<string, string>) => void }) {
  const views = [
    ['Review queue', { approvalStatus: 'Pending Review' }],
    ['Critical equipment', { category: 'Critical' }],
    ['Safety critical', { safetyCritical: 'true' }],
    ['PSM critical', { psmCritical: 'true' }]
  ] as const;
  return <div className="flex flex-wrap gap-2">{views.map(([label, filters]) => <button key={label} className="rounded-full border border-border px-3 py-1 text-xs" onClick={() => onSelect(filters)}>{label}</button>)}</div>;
}
