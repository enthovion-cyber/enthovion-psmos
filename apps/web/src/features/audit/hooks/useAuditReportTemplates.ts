import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditReportService } from "../services/audit-report.service";
export function useAuditReportTemplates(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "reports", "templates", filters], queryFn: () => auditReportService.templates(filters) });
}
export function useAuditReportTemplate(templateId?: string) {
  return useQuery({ queryKey: ["audit", "reports", "templates", templateId], queryFn: () => auditReportService.template(String(templateId)), enabled: Boolean(templateId) });
}
export function useAuditReportTemplateMutations(templateId?: string) {
  const client = useQueryClient();
  const done = () => void client.invalidateQueries({ queryKey: ["audit", "reports", "templates"] });
  return {
    save: useMutation({ mutationFn: (data: Record<string, unknown>) => auditReportService.saveTemplate(data, templateId), onSuccess: done }),
    transition: useMutation({ mutationFn: ({ action, data }: { action: string; data?: Record<string, unknown> }) => auditReportService.templateTransition(String(templateId), action, data), onSuccess: done }),
  };
}
