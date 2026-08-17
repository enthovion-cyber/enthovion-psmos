"use client";
import { useSearchParams } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditClauses } from "../hooks/useAuditClauses";
import { AuditClauseTable } from "./AuditClauseTable";

export function AuditClauseRegisterPage() {
  const filters = Object.fromEntries(useSearchParams().entries());
  const query = useAuditClauses(filters);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title="Standard Clauses / Obligations" subtitle="Clause-level regulatory requirements with audit and evidence expectations." actionHref="/audit-compliance/standards-mapping/clauses/new" actionLabel="Create Clause" /><AuditCard title="Clause register" subtitle={`${query.data.total} clauses in scope.`}><AuditClauseTable rows={query.data.rows} /></AuditCard></div></AuditLayout>;
}
