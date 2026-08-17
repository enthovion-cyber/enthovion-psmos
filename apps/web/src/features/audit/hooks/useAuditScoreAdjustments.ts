import { useQuery } from "@tanstack/react-query";
import { auditScoringService } from "../services/audit-scoring.service";
export function useAuditScoreAdjustments(runId: string) {
  return useQuery({ queryKey: ["audit", "scoring", "adjustments", runId], enabled: Boolean(runId), queryFn: () => auditScoringService.adjustments(runId) });
}
