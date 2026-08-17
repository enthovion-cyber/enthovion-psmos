import { AuditHeader } from '../AuditHeader';
import { AuditLayout } from '../AuditLayout';
import { AuditButton, AuditCard } from '../shared/AuditUi';

const links = [
  ['/audit-compliance/history/dashboard', 'History Dashboard', 'Repeat findings, trend analytics, high-risk recurring issues, and CI opportunities.'],
  ['/audit-compliance/history/timeline', 'Cross-Audit Timeline', 'Unified events from audit programs, plans, execution, findings, CAPA, evidence, scores, reviews, and reports.'],
  ['/audit-compliance/history/repeat-findings', 'Repeat Finding Detection', 'Explainable matching and confirm/reject workflow.'],
  ['/audit-compliance/history/recurring-issues', 'Recurring Issues', 'Recurring and systemic issue clusters.'],
  ['/audit-compliance/history/trends/runs', 'Trend Runs', 'Immutable input snapshots, methodology snapshots, results, trace, and source records.'],
  ['/audit-compliance/history/continuous-improvement', 'Continuous Improvement', 'Source-backed improvement opportunities and action foundation.'],
  ['/audit-compliance/history/settings', 'Trend Settings', 'Repeat detection, staleness, notification, and methodology settings.'],
];

export function AuditHistoryPage() {
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Audit History / Trends" subtitle="Phase 12 history center, repeat finding detection, trend runs, recurring issues, snapshots, and continuous improvement." actionHref="/audit-compliance/history/trends/new" actionLabel="Run Trend Analysis" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{links.map(([href, title, subtitle]) => <AuditCard key={href} title={title} subtitle={subtitle} action={<AuditButton href={href} variant="secondary">Open</AuditButton>}><p className="text-sm text-[var(--psm-muted)]">Backend-scoped and permission-controlled. Restricted source records are redacted.</p></AuditCard>)}</div></div></AuditLayout>;
}
