import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditReportService } from "../services/audit-report.service";
export function useAuditReportMutations(reportId?: string) {
  const client = useQueryClient();
  const done = () => {
    void client.invalidateQueries({ queryKey: ["audit", "reports"] });
    if (reportId) void client.invalidateQueries({ queryKey: ["audit", "reports", reportId] });
  };
  return {
    create: useMutation({ mutationFn: (data: Record<string, unknown>) => auditReportService.create(data), onSuccess: done }),
    generate: useMutation({ mutationFn: (data: Record<string, unknown>) => auditReportService.generate(data), onSuccess: done }),
    preview: useMutation({ mutationFn: (data: Record<string, unknown>) => auditReportService.preview(data) }),
    transition: useMutation({ mutationFn: ({ action, data }: { action: string; data?: Record<string, unknown> }) => auditReportService.transition(String(reportId), action, data), onSuccess: done }),
    update: useMutation({ mutationFn: (data: Record<string, unknown>) => auditReportService.update(String(reportId), data), onSuccess: done }),
  };
}
