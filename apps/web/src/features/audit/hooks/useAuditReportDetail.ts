import { useQuery } from "@tanstack/react-query";
import { auditReportService } from "../services/audit-report.service";
export function useAuditReportDetail(reportId: string) {
  return useQuery({ queryKey: ["audit", "reports", reportId], queryFn: () => auditReportService.detail(reportId), enabled: Boolean(reportId) });
}
