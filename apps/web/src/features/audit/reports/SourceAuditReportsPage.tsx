"use client";
import { useParams } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditReports } from "../hooks/useAuditReports";
import { AuditReportTable } from "./AuditReportTable";
export function SourceAuditReportsPage({ sourceLabel, sourceModule, paramName }: { sourceLabel: string; sourceModule: string; paramName: string }) {
  const params = useParams<Record<string, string>>();
  const sourceRecordId = params[paramName];
  const query = useAuditReports({ sourceModule, sourceRecordId });
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title={`${sourceLabel} Reports`} subtitle="Source-scoped report register filtered by backend company/site access and source record ID." actionHref="/audit-compliance/reports/generate" actionLabel="Generate Report" /><AuditCard title={`${sourceLabel} linked reports`}>{query.data.rows.length ? <AuditReportTable rows={query.data.rows} /> : <AuditEmptyState title="No linked reports" message="No report records are linked to this source record yet." />}</AuditCard></div></AuditLayout>;
}
