"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditClause } from "../hooks/useAuditClauses";
import { AuditClauseForm } from "./AuditClauseForm";
export function AuditClauseFormPage({ clauseId }: { clauseId?: string }) {
  const query = useAuditClause(clauseId);
  if (clauseId && query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (clauseId && (query.error || !query.data)) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title={clauseId ? "Edit Audit Clause" : "Create Audit Clause"} subtitle="Create or maintain mapped clause-level obligations." actionHref="/audit-compliance/standards-mapping/clauses" /><AuditClauseForm {...(clauseId ? { id: clauseId } : {})} defaults={query.data?.clause ?? {}} /></div></AuditLayout>;
}
