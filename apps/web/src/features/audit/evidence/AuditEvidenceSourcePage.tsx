"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditEvidenceSource } from "../hooks/useAuditEvidenceSource";
import { AuditEvidenceTable } from "./AuditEvidenceTable";

export function AuditEvidenceSourcePage({ sourcePath, title }: { sourcePath: string; title: string }) {
  const query = useAuditEvidenceSource(sourcePath);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title={title} subtitle="Evidence linked to this source record through backend evidence-link records." actionHref="/audit-compliance/evidence/new" /><AuditCard title={`${query.data.total} linked evidence records`}><AuditEvidenceTable rows={query.data.rows} /></AuditCard></div></AuditLayout>;
}
