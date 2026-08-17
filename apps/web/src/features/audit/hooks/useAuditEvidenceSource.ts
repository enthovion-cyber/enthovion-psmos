import { useQuery } from "@tanstack/react-query";
import { auditEvidenceService } from "../services/audit-evidence.service";

export function useAuditEvidenceSource(path: string, filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "evidence", "source", path, filters], enabled: Boolean(path), queryFn: () => auditEvidenceService.source(path, filters) });
}
