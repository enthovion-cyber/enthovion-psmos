import { useQuery } from "@tanstack/react-query";
import { get } from "../services/audit-api";

export function useAuditExecutionProgress(id?: string) {
  return useQuery({ queryKey: ["audit", "execution", "progress", id], queryFn: () => get<Record<string, any>>(`/audit-compliance/execution/${id}/progress`), enabled: Boolean(id) });
}
