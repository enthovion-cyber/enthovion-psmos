export function validateAuditEvidenceReview(payload: Record<string, any>, decision: string) {
  if ((decision === "reject" || decision === "request-rework") && !payload.reason && !payload.reviewComment) return "Reject and rework decisions require a reason.";
  return "";
}
