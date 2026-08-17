import { AuditBadge } from "./AuditUi";

function tone(value?: string) {
  const v = (value ?? "").toLowerCase();
  if (v.includes("verified") || v.includes("fulfilled") || v.includes("allowed") || v.includes("ready")) return "good" as const;
  if (v.includes("reject") || v.includes("missing") || v.includes("denied") || v.includes("restricted") || v.includes("overdue")) return "danger" as const;
  if (v.includes("review") || v.includes("rework") || v.includes("partial") || v.includes("waived") || v.includes("superseded")) return "warn" as const;
  if (v.includes("collected") || v.includes("sent") || v.includes("submitted")) return "info" as const;
  return "neutral" as const;
}

export function AuditEvidenceStatusBadge({ value, status }: { value?: string | null | undefined; status?: string | null | undefined }) {
  const shown = value ?? status;
  return <AuditBadge tone={tone(shown ?? undefined)}>{shown || "Unknown"}</AuditBadge>;
}

export function AuditEvidenceReviewBadge({ value }: { value?: string | null | undefined }) {
  return <AuditBadge tone={tone(value ?? undefined)}>{value || "Not Required"}</AuditBadge>;
}

export function AuditEvidenceReadinessBadge({ value }: { value?: string | null | undefined }) {
  return <AuditBadge tone={tone(value ?? undefined)}>{value || "Not Ready"}</AuditBadge>;
}

export function AuditEvidenceRequirementBadge({ value }: { value?: string | null | undefined }) {
  return <AuditBadge tone={tone(value ?? undefined)}>{value || "Open"}</AuditBadge>;
}

export function AuditEvidenceRequestBadge({ value }: { value?: string | null | undefined }) {
  return <AuditBadge tone={tone(value ?? undefined)}>{value || "Draft"}</AuditBadge>;
}

export function AuditEvidenceConfidentialityBadge({ value }: { value?: string | null | undefined }) {
  return <AuditBadge tone={tone(value ?? undefined)}>{value || "Internal"}</AuditBadge>;
}

export function AuditEvidenceCriticalityBadge({ value }: { value?: string | null | undefined }) {
  return <AuditBadge tone={tone(value ?? undefined)}>{value || "Medium"}</AuditBadge>;
}

export function AuditEvidenceAccessBadge({ value }: { value?: string | null | undefined }) {
  return <AuditBadge tone={tone(value ?? undefined)}>{value || "Logged"}</AuditBadge>;
}
