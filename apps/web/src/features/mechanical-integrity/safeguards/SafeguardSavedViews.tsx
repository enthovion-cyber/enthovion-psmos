export function SafeguardSavedViews() {
  return (
    <section className="flex flex-wrap gap-2">
      {['Due this month', 'Overdue', 'Failed last test', 'Active bypass', 'Missing LOPA/SIL', 'Startup blocked'].map((view) => (
        <span key={view} className="rounded-full border border-[var(--psm-line)] bg-[var(--psm-surface-2)] px-3 py-1 text-xs font-semibold text-[var(--psm-muted)]">{view}</span>
      ))}
    </section>
  );
}
