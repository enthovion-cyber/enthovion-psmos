"use client";
import { useState } from "react";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditExecutions } from "../hooks/useAuditExecutions";
import { AuditExecutionFilters } from "./AuditExecutionFilters";
import { AuditExecutionSummaryCards } from "./AuditExecutionSummaryCards";
import { AuditExecutionTable } from "./AuditExecutionTable";
import { AuditExecutionMobileCards } from "./AuditExecutionMobileCards";

export function AuditExecutionRegisterPage({ preset = {} }: { preset?: Record<string, unknown> }) {
  const [filters, setFilters] = useState(preset);
  const query = useAuditExecutions(filters);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title="Audit Execution Register" subtitle="Server-filtered audit executions, checklist response progress, evidence gaps, field findings, and completion readiness." actionHref="/audit-compliance/execution/start-from-plan" />
        <AuditExecutionSummaryCards summary={query.data.summary} />
        <AuditCard title="Filters" action={<div className="flex gap-2"><AuditButton href="/audit-compliance/execution/dashboard" variant="secondary">Dashboard</AuditButton><AuditButton href="/audit-compliance/execution/field-findings" variant="secondary">Field findings</AuditButton></div>}><AuditExecutionFilters value={filters} onChange={setFilters} /></AuditCard>
        <AuditCard title={`${query.data.total} executions`}>{query.data.rows.length ? <><AuditExecutionTable rows={query.data.rows} /><AuditExecutionMobileCards rows={query.data.rows} /></> : <AuditEmptyState title="No audit executions match" message="No backend execution rows matched the current filters." action={<AuditButton href="/audit-compliance/execution/start-from-plan">Start from plan</AuditButton>} />}</AuditCard>
      </div>
    </AuditLayout>
  );
}
