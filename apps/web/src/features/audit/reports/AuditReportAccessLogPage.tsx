"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditReportAccessLog, useAuditReportDownloads } from "../hooks/useAuditReportAccessLog";
export function AuditReportAccessLogPage({ downloads = false }: { downloads?: boolean }) {
  const query = downloads ? useAuditReportDownloads() : useAuditReportAccessLog();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title={downloads ? "Report Download Events" : "Report Access Log"} subtitle="Preview, download, export, and access events are backend logged and tenant scoped." actionHref="/audit-compliance/reports" actionLabel="Reports" /><AuditCard title={downloads ? "Downloads" : "Access Events"}>{query.data.rows.length ? <div className="space-y-2">{query.data.rows.map((row, index) => <pre key={String(row.id ?? index)} className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(row, null, 2)}</pre>)}</div> : <AuditEmptyState title="No access events" message="No report access/download events are visible." />}</AuditCard></div></AuditLayout>;
}
