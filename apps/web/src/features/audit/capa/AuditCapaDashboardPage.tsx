"use client";
import { useState } from "react";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditCapaDashboard } from "../hooks/useAuditCapaDashboard";
import { AuditCapaFilters } from "./AuditCapaFilters";
import { AuditCapaSummaryCards } from "./AuditCapaSummaryCards";
import { AuditCapaTable } from "./AuditCapaTable";

export function AuditCapaDashboardPage() {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const query = useAuditCapaDashboard(filters);
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const sections = [
    ["CAPA status by site", query.data.bySite],
    ["CAPA status by unit", query.data.byUnit],
    ["CAPA status by audit program", query.data.byProgram],
    ["CAPA status by audit plan", query.data.byPlan],
    ["CAPA workload by owner", query.data.byOwner],
    ["CAPA status by module", query.data.byModule],
    ["CAPA status by finding severity", query.data.bySeverity],
  ] as const;
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title="Audit CAPA / Action Dashboard" subtitle="Backend aggregation for corrective actions, preventive actions, containment, verification, effectiveness, overdue work, and finding closure readiness." actionHref="/audit-compliance/capa/create-from-finding" />
        <AuditCapaSummaryCards summary={query.data.summary} />
        <AuditCard title="Filters"><AuditCapaFilters value={filters} onChange={setFilters} /></AuditCard>
        <div className="grid gap-4 xl:grid-cols-2">
          {sections.map(([title, rows]) => <AuditBreakdown key={title} title={title} rows={rows} />)}
        </div>
        <AuditCard title="Overdue action preview">{query.data.overdue.length ? <AuditCapaTable rows={query.data.overdue.slice(0, 8)} /> : <AuditEmptyState title="No overdue CAPA actions" message="No backend CAPA package has overdue required actions in this scope." />}</AuditCard>
        <AuditCard title="Findings waiting for CAPA" action={<AuditButton href="/audit-compliance/capa/create-from-finding" variant="secondary">Create CAPA From Finding</AuditButton>}>
          {query.data.findingsWaitingForCapa.length ? <div className="grid gap-2">{query.data.findingsWaitingForCapa.map((row) => <div key={row.id} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3 text-sm text-[var(--psm-fg)]">{row.finding_code} - {row.finding_title}</div>)}</div> : <AuditEmptyState title="No findings waiting for CAPA" message="Confirmed ready-for-CAPA findings will appear here from the backend." />}
        </AuditCard>
        <AuditCard title="Recent CAPA updates">{query.data.recent.length ? <AuditCapaTable rows={query.data.recent} /> : <AuditEmptyState title="No CAPA packages yet" message="Create a CAPA package from a confirmed audit finding to begin action tracking." action={<AuditButton href="/audit-compliance/capa/create-from-finding">Create CAPA From Finding</AuditButton>} />}</AuditCard>
      </div>
    </AuditLayout>
  );
}

function AuditBreakdown({ title, rows }: { title: string; rows: Record<string, any>[] }) {
  return (
    <AuditCard title={title}>
      {rows.length ? <div className="space-y-2">{rows.map((row) => <div key={String(row.key)} className="flex items-center justify-between rounded-lg bg-[var(--psm-surface-2)] px-3 py-2 text-sm"><span className="text-[var(--psm-fg)]">{row.label ?? row.key}</span><span className="font-semibold text-primary">{row.count}</span></div>)}</div> : <AuditEmptyState title="No data" message="No backend rows match this grouping in the current filter scope." />}
    </AuditCard>
  );
}
