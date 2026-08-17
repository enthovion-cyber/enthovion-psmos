"use client";
import { useState } from "react";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditFindings } from "../hooks/useAuditFindings";
import { AuditFindingFilters } from "./AuditFindingFilters";
import { AuditFindingMobileCards } from "./AuditFindingMobileCards";
import { AuditFindingSummaryCards } from "./AuditFindingSummaryCards";
import { AuditFindingTable } from "./AuditFindingTable";

export function AuditFindingRegisterPage({ preset = {} }: { preset?: Record<string, unknown> }) {
  const [filters, setFilters] = useState(preset);
  const query = useAuditFindings(filters);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title="Audit Finding Register" subtitle="Formal lifecycle register for source-linked audit findings, classification, ownership, evidence, duplicate/repeat status, review, and CAPA readiness." actionHref="/audit-compliance/findings/new" />
        <AuditFindingSummaryCards summary={query.data.summary} />
        <AuditCard title="Advanced filters / saved view foundation" action={<div className="flex flex-wrap gap-2"><AuditButton href="/audit-compliance/findings/dashboard" variant="secondary">Dashboard</AuditButton><AuditButton href="/audit-compliance/findings/convert-from-field" variant="secondary">Convert field finding</AuditButton></div>}><AuditFindingFilters value={filters} onChange={setFilters} /></AuditCard>
        <AuditCard title={`${query.data.total} formal findings`}>
          {query.data.rows.length ? <><AuditFindingTable rows={query.data.rows} /><AuditFindingMobileCards rows={query.data.rows} /></> : <AuditEmptyState title="No audit findings match" message="No formal finding rows matched the active backend filters and permission scope." action={<AuditButton href="/audit-compliance/findings/new">Create finding</AuditButton>} />}
        </AuditCard>
      </div>
    </AuditLayout>
  );
}
