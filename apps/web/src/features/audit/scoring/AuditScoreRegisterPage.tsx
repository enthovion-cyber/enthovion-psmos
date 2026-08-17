"use client";
import { useState } from "react";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { AuditScoreFilters } from "./AuditScoreFilters";
import { AuditScoreMobileCards } from "./AuditScoreMobileCards";
import { AuditScoreTable } from "./AuditScoreTable";
import { AuditScoringSummaryCards } from "./AuditScoringSummaryCards";
import { useAuditScores } from "../hooks/useAuditScores";

export function AuditScoreRegisterPage({ preset = {} }: { preset?: Record<string, unknown> }) {
  const [filters, setFilters] = useState<Record<string, unknown>>(preset);
  const query = useAuditScores(filters);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title="Audit Score Register" subtitle="Every score run is backend-calculated, traceable, scoped to company/site, and tied to its input snapshot." actionHref="/audit-compliance/scoring/runs/new" />
    <AuditScoringSummaryCards summary={query.data.summary} compact />
    <AuditScoreFilters filters={filters} setFilters={setFilters} />
    <AuditCard title="Score runs" action={<AuditButton href="/audit-compliance/scoring/models" variant="secondary">Scoring Models</AuditButton>}>
      <AuditScoreTable rows={query.data.rows} />
      <AuditScoreMobileCards rows={query.data.rows} />
    </AuditCard>
  </div></AuditLayout>;
}
