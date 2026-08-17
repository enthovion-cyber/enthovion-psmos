import type { AuditFindingDetail } from "../../types/audit-finding.types";
import { AuditCard, AuditEmptyState } from "../../shared/AuditUi";
import { AuditFindingReviewStatusBadge } from "../../shared/AuditFindingReviewStatusBadge";

export function FindingReviewTab({ detail }: { detail: AuditFindingDetail }) {
  return <AuditCard title="Review / approval foundation">{detail.review.length ? detail.review.map((row) => <div key={row.id} className="mb-3 rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><AuditFindingReviewStatusBadge value={row.review_status} /><p className="mt-2 text-sm text-[var(--psm-muted)]">{row.review_comment ?? "No review comment."}</p><p className="mt-2 text-xs text-[var(--psm-muted)]">Submitted: {row.submitted_at ?? "-"} · Reviewed: {row.reviewed_at ?? "-"}</p></div>) : <AuditEmptyState title="No review records" message="Submit review, confirm, reject, or return the finding to create immutable review foundation records." />}</AuditCard>;
}
