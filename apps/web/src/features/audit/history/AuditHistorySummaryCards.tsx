import { AuditMetricCard } from '../shared/AuditUi';
import type { AuditHistoryDashboardSummary } from '../types/audit-history.types';

const cards: Array<[keyof AuditHistoryDashboardSummary, string, 'neutral' | 'good' | 'warn' | 'danger' | 'info', string]> = [
  ['totalHistoricalAuditEvents', 'Historical Events', 'info', '/audit-compliance/history/timeline'],
  ['completedAudits', 'Completed Audits', 'good', '/audit-compliance/execution/completed'],
  ['auditCyclesCompared', 'Cycles Compared', 'neutral', '/audit-compliance/history/trends/runs'],
  ['repeatFindings', 'Repeat Findings', 'warn', '/audit-compliance/history/repeat-findings'],
  ['recurringIssues', 'Recurring Issues', 'warn', '/audit-compliance/history/recurring-issues'],
  ['systemicFindings', 'Systemic Findings', 'danger', '/audit-compliance/history/recurring-issues'],
  ['firstTimeFindings', 'First-Time Findings', 'neutral', '/audit-compliance/findings/register'],
  ['findingsReopened', 'Findings Reopened', 'warn', '/audit-compliance/findings/reopened'],
  ['findingsRepeatedAfterCapa', 'Repeated After CAPA', 'danger', '/audit-compliance/history/repeat-findings'],
  ['capaIneffective', 'CAPA Ineffective', 'danger', '/audit-compliance/history/capa-effectiveness-trends'],
  ['capaOverdueRepeats', 'CAPA Overdue Repeats', 'danger', '/audit-compliance/capa/overdue'],
  ['evidenceGapsRepeated', 'Evidence Gaps Repeated', 'warn', '/audit-compliance/history/evidence-gap-trends'],
  ['standardsWithRepeatedFindings', 'Repeated Standards', 'warn', '/audit-compliance/history/by-standard'],
  ['clausesWithRepeatedFindings', 'Repeated Clauses', 'warn', '/audit-compliance/history/by-clause'],
  ['modulesWithRepeatedFindings', 'Repeated Modules', 'warn', '/audit-compliance/history/by-module'],
  ['unitsWithRepeatedFindings', 'Repeated Units', 'warn', '/audit-compliance/history/by-unit'],
  ['equipmentWithRepeatedFindings', 'Repeated Equipment', 'warn', '/audit-compliance/history/by-equipment'],
  ['decliningComplianceScores', 'Declining Scores', 'danger', '/audit-compliance/history/compliance-score-trends'],
  ['improvingComplianceScores', 'Improving Scores', 'good', '/audit-compliance/history/compliance-score-trends'],
  ['reviewCycleSlaBreaches', 'Review SLA Breaches', 'danger', '/audit-compliance/history/review-cycle-trends'],
  ['reportsGenerated', 'Reports Generated', 'info', '/audit-compliance/history/report-export-trends'],
  ['reportsStale', 'Reports Stale', 'warn', '/audit-compliance/reports/stale'],
  ['continuousImprovementOpportunities', 'CI Opportunities', 'info', '/audit-compliance/history/continuous-improvement'],
  ['trendRunsCompleted', 'Trend Runs Completed', 'good', '/audit-compliance/history/trends/runs'],
  ['staleTrendRuns', 'Stale Trend Runs', 'danger', '/audit-compliance/history/stale-trends'],
];

export function AuditHistorySummaryCards({ summary }: { summary: AuditHistoryDashboardSummary }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{cards.map(([key, label, tone, href]) => <AuditMetricCard key={key} label={label} value={summary[key] ?? 0} tone={tone} href={href} />)}</div>;
}
