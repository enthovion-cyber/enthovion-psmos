import { AuditMetricCard } from "../shared/AuditUi";

const cards = [
  ["Score Runs", "total", "info", "/audit-compliance/scoring/register"],
  ["Average Score", "averageScore", "neutral", "/audit-compliance/scoring/scorecards"],
  ["Calculated", "calculated", "info", "/audit-compliance/scoring/runs"],
  ["Pending Verification", "pendingVerification", "warn", "/audit-compliance/scoring/pending-verification"],
  ["Verified", "verified", "good", "/audit-compliance/scoring/runs"],
  ["Adjusted", "adjusted", "warn", "/audit-compliance/scoring/adjusted"],
  ["Locked", "locked", "good", "/audit-compliance/scoring/locked"],
  ["Stale", "stale", "danger", "/audit-compliance/scoring/stale"],
  ["Input Missing", "inputMissing", "danger", "/audit-compliance/scoring/register"],
  ["Critical Blockers", "blockers", "danger", "/audit-compliance/scoring/dashboard/critical-blockers"],
  ["Grade A", "gradeA", "good", "/audit-compliance/scoring/scorecards"],
  ["Grade F", "gradeF", "danger", "/audit-compliance/scoring/scorecards"],
] as const;

export function AuditScoringSummaryCards({ summary = {}, compact = false }: { summary?: Record<string, number | null> | undefined; compact?: boolean | undefined }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(compact ? cards.slice(0, 8) : cards).map(([label, key, tone, href]) => <AuditMetricCard key={key} label={label} value={summary[key] ?? 0} tone={tone} href={href} />)}</div>;
}
