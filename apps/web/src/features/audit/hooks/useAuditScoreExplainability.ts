import { useQuery } from "@tanstack/react-query";
import { auditScoringService } from "../services/audit-scoring.service";
export function useAuditScoreExplainability(runId: string) {
  return useQuery({ queryKey: ["audit", "scoring", "explainability", runId], enabled: Boolean(runId), queryFn: () => auditScoringService.explainability(runId) });
}
