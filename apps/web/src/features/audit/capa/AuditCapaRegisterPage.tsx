"use client";
import { useState } from "react";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditCapas } from "../hooks/useAuditCapas";
import { AuditCapaFilters } from "./AuditCapaFilters";
import { AuditCapaMobileCards } from "./AuditCapaMobileCards";
import { AuditCapaSummaryCards } from "./AuditCapaSummaryCards";
import { AuditCapaTable } from "./AuditCapaTable";

export function AuditCapaRegisterPage({ preset = {} }: { preset?: Record<string, unknown> }) {
  const [filters, setFilters] = useState(preset);
  const query = useAuditCapas(filters);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title="Audit CAPA / Action Register" subtitle="Action-ready CAPA packages linked to confirmed audit findings, Action Engine mappings, verification, effectiveness, and closure readiness." actionHref="/audit-compliance/capa/new" />
        <AuditCapaSummaryCards summary={query.data.summary} compact />
        <AuditCard title="Advanced filters / saved view foundation" action={<div className="flex flex-wrap gap-2"><AuditButton href="/audit-compliance/capa/dashboard" variant="secondary">Dashboard</AuditButton><AuditButton href="/audit-compliance/capa/create-from-finding" variant="secondary">Create from finding</AuditButton></div>}><AuditCapaFilters value={filters} onChange={setFilters} /></AuditCard>
        <AuditCard title={`${query.data.total} CAPA packages`}>
          {query.data.rows.length ? <><AuditCapaTable rows={query.data.rows} /><AuditCapaMobileCards rows={query.data.rows} /></> : <AuditEmptyState title="No CAPA packages match" message="No backend CAPA packages matched the active filters and permission scope." action={<AuditButton href="/audit-compliance/capa/create-from-finding">Create CAPA From Finding</AuditButton>} />}
        </AuditCard>
      </div>
    </AuditLayout>
  );
}
