"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { AuditScoreRunForm } from "./AuditScoreRunForm";
import { auditScoringService } from "../services/audit-scoring.service";
import { useAuditScoringContext } from "../hooks/useAuditScores";

export function AuditScoreRunFormPage({ sourceType, sourceId }: { sourceType?: string; sourceId?: string }) {
  const router = useRouter();
  const context = useAuditScoringContext();
  const [error, setError] = useState<unknown>(null);
  if (context.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (context.error || !context.data) return <AuditLayout><AuditErrorState message={context.error} onRetry={() => context.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title="Run Compliance Score" subtitle="Backend creates input and methodology snapshots, then calculates score, grade, deductions, caps, blockers, explainability, and traceability." />
    {error ? <AuditErrorState message={error} /> : null}
    <AuditCard><AuditScoreRunForm context={context.data} sourceType={sourceType} sourceId={sourceId} onSubmit={async (payload) => { try { const detail = await auditScoringService.createRun(payload); router.push(`/audit-compliance/scoring/runs/${detail.scoreRun.id}`); } catch (err) { setError(err); } }} /></AuditCard>
  </div></AuditLayout>;
}
