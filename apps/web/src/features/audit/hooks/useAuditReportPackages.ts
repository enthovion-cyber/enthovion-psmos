import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditReportService } from "../services/audit-report.service";
export function useAuditReportPackages(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "reports", "packages", filters], queryFn: () => auditReportService.packages(filters) });
}
export function useAuditReportPackage(packageId?: string) {
  return useQuery({ queryKey: ["audit", "reports", "packages", packageId], queryFn: () => auditReportService.packageDetail(String(packageId)), enabled: Boolean(packageId) });
}
export function useAuditReportPackageMutations(packageId?: string) {
  const client = useQueryClient();
  const done = () => void client.invalidateQueries({ queryKey: ["audit", "reports", "packages"] });
  return {
    create: useMutation({ mutationFn: (data: Record<string, unknown>) => auditReportService.createPackage(data), onSuccess: done }),
    transition: useMutation({ mutationFn: ({ action, data }: { action: string; data?: Record<string, unknown> }) => auditReportService.packageTransition(String(packageId), action, data), onSuccess: done }),
    addItem: useMutation({ mutationFn: ({ kind, data }: { kind: "report" | "evidence"; data: Record<string, unknown> }) => auditReportService.addPackageItem(String(packageId), kind, data), onSuccess: done }),
  };
}
