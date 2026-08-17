import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditReportService } from "../services/audit-report.service";
export function useAuditReportJobs(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "reports", "jobs", filters], queryFn: () => auditReportService.jobs(filters) });
}
export function useAuditReportJob(jobId?: string) {
  return useQuery({ queryKey: ["audit", "reports", "jobs", jobId], queryFn: () => auditReportService.job(String(jobId)), enabled: Boolean(jobId) });
}
export function useAuditReportJobMutations(jobId?: string) {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ action, data }: { action: string; data?: Record<string, unknown> }) => auditReportService.jobTransition(String(jobId), action, data), onSuccess: () => void client.invalidateQueries({ queryKey: ["audit", "reports", "jobs"] }) });
}
