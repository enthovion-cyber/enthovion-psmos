"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { auditScoringService } from "../services/audit-scoring.service";
import { AuditScoringModelForm } from "./AuditScoringModelForm";
import { useAuditScoringModelDetail } from "../hooks/useAuditScoringModels";

export function AuditScoringModelFormPage({ modelId }: { modelId?: string }) {
  const router = useRouter();
  const detail = useAuditScoringModelDetail(modelId ?? "");
  const [error, setError] = useState<unknown>(null);
  if (modelId && detail.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (modelId && (detail.error || !detail.data)) return <AuditLayout><AuditErrorState message={detail.error} onRetry={() => detail.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title={modelId ? "Edit Scoring Model" : "Create Scoring Model"} subtitle="Define versioned methodology metadata. Rules remain separate and previous score runs keep old snapshots." />
    {error ? <AuditErrorState message={error} /> : null}
    <AuditCard><AuditScoringModelForm initial={detail.data?.model} onSubmit={async (payload) => { try { const saved: any = await auditScoringService.saveModel(payload, modelId); router.push(`/audit-compliance/scoring/models/${saved.model?.id ?? saved.id ?? modelId}`); } catch (err) { setError(err); } }} /></AuditCard>
  </div></AuditLayout>;
}
