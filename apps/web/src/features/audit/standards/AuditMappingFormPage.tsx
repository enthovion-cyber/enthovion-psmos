"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditMappingDetail } from "../hooks/useAuditMappingDetail";
import { AuditMappingForm } from "./AuditMappingForm";

export function AuditMappingFormPage({ mappingId }: { mappingId?: string }) {
  const detail = useAuditMappingDetail(mappingId);
  if (mappingId && detail.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (mappingId && (detail.error || !detail.data)) return <AuditLayout><AuditErrorState message={detail.error} onRetry={() => detail.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5"><AuditHeader title={mappingId ? "Edit Standards Mapping" : "Create Standards Mapping"} subtitle="Map a regulatory/standard clause to real audit records and backend-generated traceability." actionHref="/audit-compliance/standards-mapping/register" /><AuditMappingForm {...(mappingId ? { id: mappingId } : {})} defaults={detail.data?.mapping ?? {}} /></div></AuditLayout>;
}
