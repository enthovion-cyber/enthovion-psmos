import { useQuery } from "@tanstack/react-query";
import { auditReportService } from "../services/audit-report.service";
export function useAuditReports(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "reports", "register", filters], queryFn: () => auditReportService.list(filters) });
}
export function useAuditReportView(view: string, filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "reports", "view", view, filters], queryFn: () => auditReportService.view(view, filters) });
}
