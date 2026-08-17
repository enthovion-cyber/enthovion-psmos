import { useQuery } from "@tanstack/react-query";
import { auditScoringService } from "../services/audit-scoring.service";
export function useAuditScoringRules(modelId: string) {
  return useQuery({ queryKey: ["audit", "scoring", "rules", modelId], enabled: Boolean(modelId), queryFn: () => auditScoringService.rules(modelId) });
}
