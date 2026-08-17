import { AuditMetricCard } from "../shared/AuditUi";

const cards = [
  ["Total CAPA Packages", "total", "info", "/audit-compliance/capa/register"],
  ["Open CAPA", "open", "info", "/audit-compliance/capa/open"],
  ["Draft CAPA", "draft", "neutral", "/audit-compliance/capa/draft"],
  ["CAPA In Progress", "inProgress", "info", "/audit-compliance/capa/in-progress"],
  ["CAPA Overdue", "overdue", "danger", "/audit-compliance/capa/overdue"],
  ["CAPA Completed", "completed", "good", "/audit-compliance/capa/completed"],
  ["Pending Verification", "pendingVerification", "warn", "/audit-compliance/capa/pending-verification"],
  ["Verification Failed", "verificationFailed", "danger", "/audit-compliance/capa/verification-failed"],
  ["Effectiveness Pending", "effectivenessPending", "warn", "/audit-compliance/capa/effectiveness-pending"],
  ["Ineffective CAPA", "ineffective", "danger", "/audit-compliance/capa/ineffective"],
  ["Ready For Closure", "readyForClosure", "good", "/audit-compliance/capa/ready-for-closure"],
  ["Closed CAPA", "closed", "good", "/audit-compliance/capa/closed"],
  ["Reopened CAPA", "reopened", "warn", "/audit-compliance/capa/reopened"],
  ["Safety-Critical CAPA", "safetyCritical", "danger", "/audit-compliance/capa/safety-critical"],
  ["Regulatory-Critical CAPA", "regulatoryCritical", "danger", "/audit-compliance/capa/regulatory-critical"],
  ["Repeat Finding CAPA", "repeatFindingCapa", "warn", "/audit-compliance/capa/repeat-findings"],
  ["Corrective Actions Open", "correctiveActionsOpen", "info", undefined],
  ["Preventive Actions Open", "preventiveActionsOpen", "info", undefined],
  ["Immediate Containments Open", "immediateContainmentsOpen", "warn", undefined],
  ["Actions Overdue", "actionsOverdue", "danger", undefined],
  ["Actions Without Owner", "actionsWithoutOwner", "warn", undefined],
  ["Actions Missing Evidence", "actionsMissingEvidence", "warn", undefined],
  ["Findings Closure-Ready", "findingsClosureReady", "good", undefined],
] as const;

export function AuditCapaSummaryCards({ summary = {}, compact = false }: { summary?: Record<string, number>; compact?: boolean }) {
  const visible = compact ? cards.slice(0, 11) : cards;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {visible.map(([label, key, tone, href]) => <AuditMetricCard key={key} label={label} value={summary[key] ?? 0} tone={tone} href={href} />)}
    </div>
  );
}
