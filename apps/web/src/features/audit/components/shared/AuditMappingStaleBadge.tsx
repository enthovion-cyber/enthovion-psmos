import { StatusBadge } from "../../standards/shared";
export function AuditMappingStaleBadge({ value }: { value?: string | null | undefined }) { return <StatusBadge value={value} />; }
