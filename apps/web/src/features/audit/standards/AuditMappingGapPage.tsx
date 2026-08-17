"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditMappingGaps } from "../hooks/useAuditMappingGaps";
import { AuditMappingGapPanel } from "./AuditMappingGapPanel";
export function AuditMappingGapPage() {
  const query = useAuditMappingGaps();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Standards Mapping Gaps" subtitle="Missing clause mappings, evidence gaps, score gaps, stale source warnings, and traceability blockers." actionHref="/audit-compliance/standards-mapping/new" /><AuditMappingGapPanel rows={query.data.rows} /></div></AuditLayout>;
}
