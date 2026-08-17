import { AuditMetricCard } from "../shared/AuditUi";
import type { AuditApprovalSummary } from "../types/audit-review.types";

export function AuditReviewSummaryCards({ summary }: { summary: AuditApprovalSummary }) {
  const cards = [
    ["Pending approval", summary.pending, "info", "/audit-compliance/review-approval/pending"],
    ["Overdue", summary.overdue, "danger", "/audit-compliance/review-approval/overdue"],
    ["Stale packages", summary.stale, "warn", "/audit-compliance/review-approval/stale"],
    ["Validation failures", summary.validationFailures, "danger", "/audit-compliance/review-approval/validation-failures"],
    ["E-sign pending", summary.esignaturePending, "warn", "/audit-compliance/review-approval/e-signatures"],
    ["Approved", summary.approved, "good", "/audit-compliance/review-approval/approved"],
    ["Approved with conditions", summary.approvedWithConditions, "warn", "/audit-compliance/review-approval/approved-with-conditions"],
    ["Report ready", summary.reportReady, "good", "/audit-compliance/review-approval/completed"],
  ] as const;
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, tone, href]) => <AuditMetricCard key={label} label={label} value={value} tone={tone} href={href} />)}</div>;
}
