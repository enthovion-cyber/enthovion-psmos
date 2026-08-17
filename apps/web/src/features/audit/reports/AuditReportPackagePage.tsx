"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { AuditReportPackageStatusBadge } from "../shared/AuditReportPackageStatusBadge";
import { useAuditReportPackages } from "../hooks/useAuditReportPackages";
export function AuditReportPackagePage() {
  const query = useAuditReportPackages();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Report Package Builder" subtitle="Package generated reports, evidence manifests, export files, and appendices with backend access/redaction controls." actionHref="/audit-compliance/reports/generate" actionLabel="Generate Report" /><AuditCard title="Packages">{query.data.rows.length ? <div className="grid gap-3 md:grid-cols-2">{query.data.rows.map((row) => <a key={String(row.id)} href={`/audit-compliance/reports/packages/${row.id}`} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="flex justify-between gap-3"><b>{String(row.package_title ?? row.package_code)}</b><AuditReportPackageStatusBadge status={String(row.package_status ?? "Draft")} /></div><p className="mt-2 text-sm text-[var(--psm-muted)]">{String(row.package_type ?? "Audit Report Package")}</p></a>)}</div> : <AuditEmptyState title="No packages" message="No report packages are visible." />}</AuditCard></div></AuditLayout>;
}
