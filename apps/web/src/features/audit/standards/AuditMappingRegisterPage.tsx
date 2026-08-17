"use client";
import { useSearchParams } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditMappings, useAuditMappingView } from "../hooks/useAuditMappings";
import { AuditMappingFilters } from "./AuditMappingFilters";
import { AuditMappingMobileCards } from "./AuditMappingMobileCards";
import { AuditMappingTable } from "./AuditMappingTable";
import { AuditStandardsSummaryCards } from "./AuditStandardsSummaryCards";

export function AuditMappingRegisterPage({ view, title }: { view?: string; title?: string }) {
  const params = useSearchParams();
  const filters = Object.fromEntries(params.entries());
  const query = view ? useAuditMappingView(view, filters) : useAuditMappings(filters);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title={title ?? "Standards Mapping Register"} subtitle="Server-side searchable mappings across standards, clauses, audit objects, evidence, findings, CAPA, score runs, sites, units, and modules." actionHref="/audit-compliance/standards-mapping/new" actionLabel="Create Mapping" />
    <AuditStandardsSummaryCards {...(query.data.summary ? { summary: query.data.summary } : {})} />
    <AuditMappingFilters />
    <AuditCard title="Mapping register" subtitle={`${query.data.total ?? query.data.rows.length} mappings in the current backend scope.`}>
      <div className="hidden lg:block"><AuditMappingTable rows={query.data.rows} /></div>
      <AuditMappingMobileCards rows={query.data.rows} />
    </AuditCard>
  </div></AuditLayout>;
}
