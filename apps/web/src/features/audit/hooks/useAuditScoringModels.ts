import { useQuery } from "@tanstack/react-query";
import { auditScoringService } from "../services/audit-scoring.service";
export function useAuditScoringModels(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "scoring", "models", filters], queryFn: () => auditScoringService.models(filters) });
}
export function useAuditScoringModelDetail(modelId: string) {
  return useQuery({ queryKey: ["audit", "scoring", "model", modelId], enabled: Boolean(modelId), queryFn: () => auditScoringService.modelDetail(modelId) });
}
