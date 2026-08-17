import { AuditMetricCard } from "../shared/AuditUi";
import type { AuditEvidenceSummary } from "../types/audit-evidence.types";

const cards: [string, string, "neutral" | "good" | "warn" | "danger" | "info", string][] = [
  ["Evidence Records", "totalEvidenceRecords", "info", "/audit-compliance/evidence/register"],
  ["Requirements", "evidenceRequirements", "neutral", "/audit-compliance/evidence/requirements"],
  ["Requests", "evidenceRequests", "neutral", "/audit-compliance/evidence/requests"],
  ["Collected", "evidenceCollected", "good", "/audit-compliance/evidence?status=Collected"],
  ["Missing", "evidenceMissing", "danger", "/audit-compliance/evidence/gaps"],
  ["Pending Review", "evidencePendingReview", "warn", "/audit-compliance/evidence/pending-review"],
  ["Verified", "evidenceVerified", "good", "/audit-compliance/evidence/verified"],
  ["Rejected", "evidenceRejected", "danger", "/audit-compliance/evidence/rejected"],
  ["Rework Required", "evidenceReworkRequired", "warn", "/audit-compliance/evidence/rework-required"],
  ["Restricted", "evidenceRestricted", "danger", "/audit-compliance/evidence/restricted"],
  ["Document Links", "documentControlLinks", "info", "/audit-compliance/evidence?evidenceType=Document Control"],
  ["Open Gaps", "openGaps", "danger", "/audit-compliance/evidence/gaps"],
];

export function AuditEvidenceSummaryCards({ summary = {} }: { summary?: AuditEvidenceSummary | undefined }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">{cards.map(([label, key, tone, href]) => <AuditMetricCard key={key} label={label} value={summary[key] ?? 0} tone={tone} href={href} />)}</div>;
}
