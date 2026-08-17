"use client";
import Link from "next/link";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { AuditScoringModelStatusBadge } from "../shared/AuditScoringModelStatusBadge";
import { useAuditScoringModels } from "../hooks/useAuditScoringModels";

export function AuditScoringModelRegistryPage() {
  const query = useAuditScoringModels();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title="Scoring Models" subtitle="Versioned scoring methodology, weighted rules, caps, evidence/finding/CAPA impact rules, and activation foundation." actionHref="/audit-compliance/scoring/models/new" />
    <AuditCard title="Model registry">{query.data.rows.length ? <div className="grid gap-3">{query.data.rows.map((row: any) => <Link href={`/audit-compliance/scoring/models/${row.id}`} key={row.id} className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><b className="text-primary">{row.model_code}</b><h3 className="text-lg font-semibold">{row.model_title}</h3><p className="text-sm text-[var(--psm-muted)]">{row.model_type} / v{row.methodology_version}</p></div><AuditScoringModelStatusBadge value={row.model_status} /></div>
    </Link>)}</div> : <AuditEmptyState title="No scoring models" message="Create or activate a scoring model before running official compliance scores." action={<AuditButton href="/audit-compliance/scoring/models/new">Create Model</AuditButton>} />}</AuditCard>
  </div></AuditLayout>;
}
