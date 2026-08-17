"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditCapaDetail } from "../hooks/useAuditCapaDetail";
import { AuditCapaForm } from "./AuditCapaForm";

export function AuditCapaFormPage({ capaId, findingId }: { capaId?: string | undefined; findingId?: string | undefined }) {
  const detail = useAuditCapaDetail(capaId ?? "");
  if (capaId && detail.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (capaId && (detail.error || !detail.data)) return <AuditLayout><AuditErrorState message={detail.error} onRetry={() => detail.refetch()} /></AuditLayout>;
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title={capaId ? "Edit Audit CAPA" : "Create Audit CAPA"} subtitle="Guided CAPA package wizard for source findings, containment, corrective/preventive actions, verification, effectiveness, ownership, and backend closure readiness." />
        <AuditCapaForm detail={detail.data} findingId={findingId} />
      </div>
    </AuditLayout>
  );
}
