'use client';

const labels: Record<string, string> = {
  totalEvents: 'Total events',
  readinessImpact: 'Readiness impact',
  startupImpact: 'Startup impact',
  criticalEvents: 'Critical events',
  approvalEvents: 'Approval events',
  exportEvents: 'Export events'
};

export function MiHistorySummaryCards({ summary = {} }: { summary?: Record<string, number> | undefined }) {
  const entries = Object.entries({ ...labels }).map(([key, label]) => ({ key, label, value: summary[key] ?? 0 }));

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {entries.map((card) => (
        <article key={card.key} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--psm-muted)]">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--psm-text)]">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
