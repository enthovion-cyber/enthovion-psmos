"use client";
import { AuditButton } from "../shared/AuditUi";
import { useAuditCoverageRecalculate } from "../hooks/useAuditCoverageMatrix";
export function AuditMappingRecalculateDialog({ mappingId }: { mappingId?: string }) {
  const recalc = useAuditCoverageRecalculate();
  return <AuditButton onClick={() => recalc.mutate(mappingId)} disabled={recalc.isPending} title={recalc.isPending ? "Recalculating coverage" : "Recalculate coverage from backend records"} variant="secondary">{recalc.isPending ? "Recalculating..." : "Recalculate Coverage"}</AuditButton>;
}
