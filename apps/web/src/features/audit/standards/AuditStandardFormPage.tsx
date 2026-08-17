"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditStandard } from "../hooks/useAuditStandards";
import { AuditStandardForm } from "./AuditStandardForm";
export function AuditStandardFormPage({ standardId }: { standardId?: string }) {
  const query = useAuditStandard(standardId);
  if (standardId && query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (standardId && (query.error || !query.data)) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title={standardId ? "Edit Audit Standard" : "Create Audit Standard"} subtitle="Create or maintain standards used by the mapping engine." actionHref="/audit-compliance/standards-mapping/standards" /><AuditStandardForm {...(standardId ? { id: standardId } : {})} defaults={query.data?.standard ?? {}} /></div></AuditLayout>;
}
