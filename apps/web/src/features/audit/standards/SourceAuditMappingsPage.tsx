"use client";
import { useQuery } from "@tanstack/react-query";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { auditMappingService } from "../services/audit-mapping.service";
import { AuditMappingTable } from "./AuditMappingTable";

export function SourceAuditMappingsPage({ path, title }: { path: string; title: string }) {
  const query = useQuery({ queryKey: ["audit", "standards-mapping", "source", path], queryFn: () => auditMappingService.source(path) });
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title={title} subtitle="Source-scoped standards mappings and traceability links for this audit object." actionHref="/audit-compliance/standards-mapping/new" /><AuditCard title="Source mappings"><AuditMappingTable rows={query.data.rows} /></AuditCard></div></AuditLayout>;
}
