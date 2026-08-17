const labels: Record<string, string> = {
  totalAssessments: 'Total Assessments',
  pendingReview: 'Pending Review',
  approved: 'Approved',
  critical: 'Critical',
  high: 'High',
  safetyCritical: 'Safety Critical',
  psmCritical: 'PSM Critical',
  reviewDue: 'Review Due',
  needsRecalculation: 'Needs Recalculation'
};

export function CriticalitySummaryCards({ summary }: { summary?: Record<string, unknown> }) {
  const entries = Object.entries(labels);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {entries.map(([key, label]) => (
        <div key={key} className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-foreground">{String(summary?.[key] ?? 0)}</div>
        </div>
      ))}
    </div>
  );
}
