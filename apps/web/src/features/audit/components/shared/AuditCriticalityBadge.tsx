import { StatusBadge } from "../../standards/shared";
export function AuditCriticalityBadge({ value }: { value?: string | null | undefined }) { return <StatusBadge value={value} />; }
