"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditStandardTraceability } from "../hooks/useAuditStandardTraceability";
import { AuditTraceabilityGraph } from "./AuditTraceabilityGraph";
export function AuditStandardTraceabilityPage() {
  const query = useAuditStandardTraceability();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Standards Traceability" subtitle="Standard -> clause -> audit object -> evidence -> finding -> CAPA -> score traceability." actionHref="/audit-compliance/standards-mapping/new" /><AuditCard title="Traceability graph"><AuditTraceabilityGraph rows={query.data.rows} /></AuditCard></div></AuditLayout>;
}
