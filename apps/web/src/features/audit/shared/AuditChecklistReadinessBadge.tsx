import { AuditBadge } from "./AuditUi";
export function AuditChecklistReadinessBadge({ value }: { value: string }) {
  return (
    <AuditBadge
      tone={
        value === "Ready For Execution" || value === "Complete"
          ? "good"
          : "warn"
      }
    >
      {value}
    </AuditBadge>
  );
}
