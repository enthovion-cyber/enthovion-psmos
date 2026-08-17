import { useQuery } from "@tanstack/react-query";
import { auditReportService } from "../services/audit-report.service";
export function useAuditReportLookups() {
  return useQuery({ queryKey: ["audit", "reports", "lookups"], queryFn: () => auditReportService.lookups() });
}
