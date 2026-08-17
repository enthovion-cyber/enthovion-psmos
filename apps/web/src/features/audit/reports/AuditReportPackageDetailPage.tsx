"use client";
import { useParams } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditReportPackage } from "../hooks/useAuditReportPackages";
export function AuditReportPackageDetailPage() {
  const params = useParams<{ packageId: string }>();
  const query = useAuditReportPackage(params.packageId);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title={String(query.data.package.package_title ?? "Report Package")} actionHref="/audit-compliance/reports/packages" actionLabel="Packages" /><AuditCard title="Package Foundation"><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(query.data, null, 2)}</pre></AuditCard></div></AuditLayout>;
}
