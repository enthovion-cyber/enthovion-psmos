export function ReliefDeviceSavedViews() {
  return (
    <div className="flex flex-wrap gap-2">
      {['All relief devices', 'Due soon', 'Overdue', 'Failed tests', 'Missing certificates', 'Startup blocked'].map((view) => (
        <span key={view} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface)] px-3 py-1 text-xs font-semibold">{view}</span>
      ))}
    </div>
  );
}
