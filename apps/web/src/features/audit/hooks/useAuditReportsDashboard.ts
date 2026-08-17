import { useQuery } from "@tanstack/react-query";
import { auditReportService } from "../services/audit-report.service";
export function useAuditReportsDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "reports", "dashboard", filters], queryFn: () => auditReportService.dashboard(filters) });
}
