import { useQuery } from "@tanstack/react-query";
import { auditScoringService } from "../services/audit-scoring.service";
export function useAuditScoreRunDetail(runId: string) {
  return useQuery({ queryKey: ["audit", "scoring", "run", runId], enabled: Boolean(runId), queryFn: () => auditScoringService.detail(runId) });
}
