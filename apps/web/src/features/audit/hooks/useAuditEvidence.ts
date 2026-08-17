import { useQuery } from "@tanstack/react-query";
import { auditEvidenceService } from "../services/audit-evidence.service";

export function useAuditEvidence(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "evidence", "register", filters], queryFn: () => auditEvidenceService.register(filters) });
}

export function useAuditEvidenceDetail(id: string) {
  return useQuery({ queryKey: ["audit", "evidence", "detail", id], enabled: Boolean(id), queryFn: () => auditEvidenceService.detail(id) });
}

export function useAuditEvidenceContext() {
  return useQuery({ queryKey: ["audit", "evidence", "context"], queryFn: auditEvidenceService.context });
}
