"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditStandardsDashboard } from "../hooks/useAuditStandardsDashboard";
import { AuditMappingTable } from "./AuditMappingTable";
import { AuditStandardsSummaryCards } from "./AuditStandardsSummaryCards";

export function AuditStandardsDashboardPage() {
  const query = useAuditStandardsDashboard();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const data = query.data;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title="Standards / Regulatory Mapping" subtitle="Clause-to-audit-object mapping, evidence/finding/CAPA/score traceability, coverage gaps, stale mappings, and report readiness." actionHref="/audit-compliance/standards-mapping/new" actionLabel="Create Mapping" />
    <AuditStandardsSummaryCards summary={data.summary} />
    <div className="grid gap-5 xl:grid-cols-3">
      <AuditCard title="Coverage by module" subtitle="Real mapped records grouped by module key.">{data.byModule.length ? <Bars rows={data.byModule} value="coveragePercent" /> : <AuditEmptyState title="No module coverage" message="No mapping records have a module key yet." />}</AuditCard>
      <AuditCard title="Coverage gaps" subtitle="Backend generated gap records.">{data.gaps.length ? <GapList rows={data.gaps.slice(0, 8)} /> : <AuditEmptyState title="No open gaps" message="No missing mapping or evidence gaps are open for the current scope." />}</AuditCard>
      <AuditCard title="Stale mappings" subtitle="Mappings that need refresh after source changes.">{data.stale.length ? <AuditMappingTable rows={data.stale.slice(0, 5)} /> : <AuditEmptyState title="No stale mappings" message="All visible mappings are current." />}</AuditCard>
    </div>
    <AuditCard title="Recent mappings" action={<AuditButton href="/audit-compliance/standards-mapping/register" variant="secondary">Open Register</AuditButton>}>{data.recent.length ? <AuditMappingTable rows={data.recent} /> : <AuditEmptyState title="No mappings yet" message="Create a mapping between a standard clause and an audit object to begin traceability." action={<AuditButton href="/audit-compliance/standards-mapping/new">Create Mapping</AuditButton>} />}</AuditCard>
  </div></AuditLayout>;
}

function Bars({ rows, value }: { rows: Record<string, any>[]; value: string }) {
  const max = Math.max(...rows.map((row) => Number(row[value] ?? row.count ?? 0)), 1);
  return <div className="space-y-3">{rows.slice(0, 10).map((row) => <div key={row.key}><div className="mb-1 flex justify-between text-sm"><span>{row.label}</span><b>{row[value] ?? row.count ?? 0}</b></div><div className="h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(4, Number(row[value] ?? row.count ?? 0) / max * 100)}%` }} /></div></div>)}</div>;
}
function GapList({ rows }: { rows: Record<string, any>[] }) {
  return <div className="space-y-3">{rows.map((gap) => <div key={gap.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><div className="font-semibold">{gap.gap_title}</div><div className="text-xs text-[var(--psm-muted)]">{gap.gap_type} · {gap.gap_severity}</div></div>)}</div>;
}
