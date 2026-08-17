"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { AuditScoreTable } from "./AuditScoreTable";
import { AuditScoringSummaryCards } from "./AuditScoringSummaryCards";
import { useAuditScoringDashboard } from "../hooks/useAuditScoringDashboard";

export function AuditScoringDashboardPage() {
  const query = useAuditScoringDashboard();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const data = query.data;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title="Compliance Scoring Dashboard" subtitle="Backend-calculated compliance scores, stale runs, critical blockers, pending verification, model coverage, and explainable score trends." actionHref="/audit-compliance/scoring/runs/new" />
    <AuditScoringSummaryCards summary={data.summary} />
    <div className="grid gap-5 xl:grid-cols-3">
      <AuditCard title="Score trend" subtitle="Calculated scores over time.">{data.trend.length ? <Bars rows={data.trend.map((row) => ({ key: row.code, label: row.code, count: row.score }))} /> : <AuditEmptyState title="No score trend yet" message="Run scores to build a backend score trend." />}</AuditCard>
      <AuditCard title="Lowest scoring areas" subtitle="Real score runs sorted by final score.">{data.lowest.length ? <AuditScoreTable rows={data.lowest} /> : <AuditEmptyState title="No scored areas" message="No score runs have a final score yet." />}</AuditCard>
      <AuditCard title="Critical score blockers" subtitle="Open safety/regulatory blockers and input gaps.">{data.criticalBlockers.length ? <AuditScoreTable rows={data.criticalBlockers} /> : <AuditEmptyState title="No critical blockers" message="No backend critical score blockers are present in current score runs." />}</AuditCard>
    </div>
    <AuditCard title="Recent score runs" action={<AuditButton href="/audit-compliance/scoring/register" variant="secondary">Open Register</AuditButton>}>{data.recent.length ? <AuditScoreTable rows={data.recent} /> : <AuditEmptyState title="No score runs" message="Create a scoring model or run a score for an execution, plan, program, site, finding, CAPA, or evidence record." action={<AuditButton href="/audit-compliance/scoring/runs/new">Run Score</AuditButton>} />}</AuditCard>
  </div></AuditLayout>;
}

function Bars({ rows }: { rows: Record<string, any>[] }) {
  const max = Math.max(...rows.map((row) => Number(row.count ?? 0)), 1);
  return <div className="space-y-3">{rows.slice(0, 8).map((row) => <div key={row.key}><div className="mb-1 flex justify-between text-sm"><span>{row.label}</span><b>{row.count ?? 0}</b></div><div className="h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(4, Number(row.count ?? 0) / max * 100)}%` }} /></div></div>)}</div>;
}
