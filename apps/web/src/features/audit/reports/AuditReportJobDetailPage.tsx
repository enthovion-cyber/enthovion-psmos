"use client";
import { useParams } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditReportJob } from "../hooks/useAuditReportJobs";
export function AuditReportJobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const query = useAuditReportJob(params.jobId);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Report Job Detail" actionHref="/audit-compliance/reports/jobs" actionLabel="Jobs" /><AuditCard title="Job Metadata"><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-4 text-xs">{JSON.stringify(query.data, null, 2)}</pre></AuditCard></div></AuditLayout>;
}
