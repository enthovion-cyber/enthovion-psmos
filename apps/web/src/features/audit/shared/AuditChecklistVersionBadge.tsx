import { AuditBadge } from "./AuditUi";
export function AuditChecklistVersionBadge({
  value,
  current,
}: {
  value: string;
  current?: boolean;
}) {
  return (
    <AuditBadge tone={current ? "good" : "neutral"}>
      v{value}
      {current ? " Current" : ""}
    </AuditBadge>
  );
}
