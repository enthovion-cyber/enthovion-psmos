"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { AuditScoringModelStatusBadge } from "../shared/AuditScoringModelStatusBadge";
import { AuditScoringRuleBuilder } from "./AuditScoringRuleBuilder";
import { AuditScoringRuleTable } from "./AuditScoringRuleTable";
import { useAuditScoringModelDetail } from "../hooks/useAuditScoringModels";

export function AuditScoringModelDetailPage({ modelId }: { modelId: string }) {
  const query = useAuditScoringModelDetail(modelId);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const model = query.data.model;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title={model.model_title} subtitle={`${model.model_code} / ${model.model_type} / methodology v${model.methodology_version}`} />
    <AuditCard title="Model status" action={<AuditScoringModelStatusBadge value={model.model_status} />}><div className="grid gap-3 md:grid-cols-4"><Metric label="Default" value={model.default_model ? "Yes" : "No"} /><Metric label="Site" value={model.site_id ?? "Company"} /><Metric label="Owner" value={model.owner_user_id ?? "-"} /><Metric label="Updated" value={model.updated_at ? new Date(model.updated_at).toLocaleString() : "-"} /></div><div className="mt-4 flex gap-2"><AuditButton href={`/audit-compliance/scoring/models/${model.id}/edit`} variant="secondary">Edit</AuditButton><AuditButton href="/audit-compliance/scoring/runs/new">Run Score</AuditButton></div></AuditCard>
    <AuditCard title="Rule Builder" subtitle="Checklist, evidence, finding, CAPA, aggregation, and critical cap rules feed backend methodology snapshots."><AuditScoringRuleBuilder modelId={model.id} onSaved={() => query.refetch()} /></AuditCard>
    <AuditScoringRuleTable rows={query.data.rules ?? []} />
  </div></AuditLayout>;
}
function Metric({ label, value }: { label: string; value: unknown }) { return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs uppercase text-[var(--psm-muted)]">{label}</p><b>{String(value)}</b></div>; }
