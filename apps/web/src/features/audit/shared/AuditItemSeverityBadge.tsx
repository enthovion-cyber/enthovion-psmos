import { AuditBadge } from "./AuditUi";
export function AuditItemSeverityBadge({ value }: { value: string }) {
  return (
    <AuditBadge tone={value?.includes("Critical") ? "danger" : "neutral"}>
      {value || "Not set"}
    </AuditBadge>
  );
}
