import { AuditMetricCard } from "../shared/AuditUi";
import type { AuditFindingSummary } from "../types/audit-finding.types";

export function AuditFindingSummaryCards({ summary }: { summary: AuditFindingSummary }) {
  const cards = [
    ["Total", summary.total, "neutral", "/audit-compliance/findings"],
    ["Open", summary.open, "info", "/audit-compliance/findings/open"],
    ["Draft", summary.draft, "neutral", "/audit-compliance/findings/draft"],
    ["Under Review", summary.underReview, "warn", "/audit-compliance/findings/under-review"],
    ["Confirmed", summary.confirmed, "good", "/audit-compliance/findings/confirmed"],
    ["Rejected", summary.rejected, "danger", "/audit-compliance/findings/rejected"],
    ["Needs More Information", summary.needsMoreInformation, "warn", "/audit-compliance/findings/needs-more-information"],
    ["Ready For CAPA", summary.readyForCapa, "good", "/audit-compliance/findings/ready-for-capa"],
    ["Awaiting Owner", summary.awaitingOwner, "warn", "/audit-compliance/findings/awaiting-owner"],
    ["Overdue", summary.overdue, "danger", "/audit-compliance/findings/overdue"],
    ["Safety-Critical", summary.safetyCritical, "danger", "/audit-compliance/findings/safety-critical"],
    ["Regulatory-Critical", summary.regulatoryCritical, "danger", "/audit-compliance/findings/regulatory-critical"],
    ["PSM-Critical", summary.psmCritical, "danger", "/audit-compliance/findings/psm-critical"],
    ["High Priority", summary.highPriority, "warn", "/audit-compliance/findings/high-priority"],
    ["Repeat Findings", summary.repeatFindings, "warn", "/audit-compliance/findings/repeat-findings"],
    ["From Field Audit", summary.fromFieldAudit, "info", "/audit-compliance/execution/ready-for-finding-register"],
    ["Missing Evidence", summary.missingEvidence, "warn", "/audit-compliance/findings?evidenceStatus=Missing"],
    ["CAPA Foundation", summary.withCapaFoundation, "good", "/audit-compliance/findings?capaReadinessStatus=CAPA Created Foundation"],
    ["Recently Created", summary.recentlyCreated, "neutral", "/audit-compliance/findings?sort=created_at.desc"],
    ["Recently Confirmed", summary.recentlyConfirmed, "good", "/audit-compliance/findings/confirmed"],
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {cards.map(([label, value, tone, href]) => <AuditMetricCard key={label} label={label} value={value} tone={tone} href={href} />)}
    </div>
  );
}
