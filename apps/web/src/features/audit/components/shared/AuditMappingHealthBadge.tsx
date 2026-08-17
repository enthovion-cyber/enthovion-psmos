import { StatusBadge } from "../../standards/shared";
export function AuditMappingHealthBadge({ value }: { value?: string | null | undefined }) { return <StatusBadge value={value} />; }
