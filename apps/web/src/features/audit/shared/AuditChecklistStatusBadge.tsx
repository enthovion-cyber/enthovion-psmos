import { AuditBadge } from "./AuditUi";
export function AuditChecklistStatusBadge({ value }: { value: string }) {
  return (
    <AuditBadge
      tone={
        ["Active", "Approved", "Current"].includes(value)
          ? "good"
          : value === "Archived" || value === "Superseded"
            ? "neutral"
            : value === "Pending Review"
              ? "warn"
              : "info"
      }
    >
      {value}
    </AuditBadge>
  );
}
