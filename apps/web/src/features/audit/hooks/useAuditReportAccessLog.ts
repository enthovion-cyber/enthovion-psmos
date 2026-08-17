import { useQuery } from "@tanstack/react-query";
import { auditReportService } from "../services/audit-report.service";
export function useAuditReportAccessLog(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "reports", "access-log", filters], queryFn: () => auditReportService.accessLog(filters) });
}
export function useAuditReportDownloads(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "reports", "downloads", filters], queryFn: () => auditReportService.downloads(filters) });
}
