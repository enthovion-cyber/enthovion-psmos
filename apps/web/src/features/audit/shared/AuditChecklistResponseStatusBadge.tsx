import { AuditBadge } from "./AuditUi";

export function AuditChecklistResponseStatusBadge({ status }: { status?: string | null }) {
  const tone = status === "Answered" || status === "Reviewed" ? "good" : status === "Needs Evidence" || status === "Needs Comment" ? "warn" : status === "Reopened" ? "danger" : "neutral";
  return <AuditBadge tone={tone}>{status ?? "Not Answered"}</AuditBadge>;
}
