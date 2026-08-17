import { useQuery } from "@tanstack/react-query";
import { auditExecutionWorkspaceService } from "../services/audit-execution-workspace.service";

export function useAuditExecutionWorkspace(id?: string) {
  return useQuery({ queryKey: ["audit", "execution", "workspace", id], queryFn: () => auditExecutionWorkspaceService.workspace(id as string), enabled: Boolean(id) });
}
