import { AuditCard } from "../shared/AuditUi";
import { AuditMappingGapTable } from "./AuditMappingGapTable";
export function AuditMappingGapPanel({ rows }: { rows: Record<string, any>[] }) {
  return <AuditCard title="Coverage / traceability gaps" subtitle="Backend-generated and manually recorded gaps that affect mapping health."><AuditMappingGapTable rows={rows} /></AuditCard>;
}
