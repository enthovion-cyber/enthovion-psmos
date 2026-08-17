"use client";
import { useState } from "react";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditButton, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditEvidence, useAuditEvidenceContext } from "../hooks/useAuditEvidence";
import { AuditEvidenceFilters } from "./AuditEvidenceFilters";
import { AuditEvidenceSummaryCards } from "./AuditEvidenceSummaryCards";
import { AuditEvidenceTable } from "./AuditEvidenceTable";

export function AuditEvidenceRegisterPage({ preset = {} }: { preset?: Record<string, any> }) {
  const [filters, setFilters] = useState(preset);
  const context = useAuditEvidenceContext();
  const query = useAuditEvidence(filters);
  if (query.isLoading || context.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title="Audit Evidence Register" subtitle="Server-side evidence register with classification, review, readiness, source links, and controlled access." actionHref="/audit-compliance/evidence/new" />
    <AuditEvidenceSummaryCards summary={query.data.summary} />
    <AuditCard title="Advanced filters / search" action={<div className="flex flex-wrap gap-2"><AuditButton href="/audit-compliance/evidence/dashboard" variant="secondary">Dashboard</AuditButton><AuditButton href="/audit-compliance/evidence/requirements" variant="secondary">Requirements</AuditButton><AuditButton href="/audit-compliance/evidence/requests" variant="secondary">Requests</AuditButton></div>}><AuditEvidenceFilters value={filters} onChange={setFilters} context={context.data} /></AuditCard>
    <AuditCard title={`${query.data.total} evidence records`}><AuditEvidenceTable rows={query.data.rows} /></AuditCard>
  </div></AuditLayout>;
}
