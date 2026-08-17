import { useQuery } from "@tanstack/react-query";
import { auditScoringService } from "../services/audit-scoring.service";
export function useAuditScoreTraceability(runId: string) {
  return useQuery({ queryKey: ["audit", "scoring", "traceability", runId], enabled: Boolean(runId), queryFn: () => auditScoringService.traceability(runId) });
}
