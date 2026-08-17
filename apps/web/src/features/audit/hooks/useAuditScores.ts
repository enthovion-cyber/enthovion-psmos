import { useQuery } from "@tanstack/react-query";
import { auditScoringService } from "../services/audit-scoring.service";
export function useAuditScores(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "scoring", "register", filters], queryFn: () => auditScoringService.register(filters) });
}
export function useAuditScoringContext() {
  return useQuery({ queryKey: ["audit", "scoring", "context"], queryFn: auditScoringService.context });
}
