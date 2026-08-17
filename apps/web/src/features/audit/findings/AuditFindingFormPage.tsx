"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditFindingDetail } from "../hooks/useAuditFindingDetail";
import { AuditFindingForm } from "./AuditFindingForm";

export function AuditFindingFormPage({ findingId }: { findingId?: string }) {
  const detail = useAuditFindingDetail(findingId ?? "");
  if (findingId && detail.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (findingId && (detail.error || !detail.data)) return <AuditLayout><AuditErrorState message={detail.error} onRetry={() => detail.refetch()} /></AuditLayout>;
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title={findingId ? "Edit Audit Finding" : "Create Audit Finding"} subtitle="Formal finding identity, source traceability, scope, classification, standards, evidence, ownership, CAPA readiness, and backend validation." />
        {detail.data ? <AuditFindingForm detail={detail.data} /> : <AuditFindingForm />}
      </div>
    </AuditLayout>
  );
}
