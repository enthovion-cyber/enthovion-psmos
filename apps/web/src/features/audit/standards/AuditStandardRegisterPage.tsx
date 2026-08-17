"use client";
import { useSearchParams } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditStandards } from "../hooks/useAuditStandards";
import { AuditStandardTable } from "./AuditStandardTable";
import { AuditStandardMobileCards } from "./AuditStandardMobileCards";

export function AuditStandardRegisterPage() {
  const filters = Object.fromEntries(useSearchParams().entries());
  const query = useAuditStandards(filters);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Audit Standards" subtitle="Real regulatory, company, site, and industry standards available for mapping." actionHref="/audit-compliance/standards-mapping/standards/new" actionLabel="Create Standard" /><AuditCard title="Standards register" subtitle={`${query.data.total} standards in scope.`}><div className="hidden lg:block"><AuditStandardTable rows={query.data.rows} /></div><AuditStandardMobileCards rows={query.data.rows} /></AuditCard></div></AuditLayout>;
}
