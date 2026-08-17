"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditExecutionDashboard } from "../hooks/useAuditExecutionDashboard";
import { AuditExecutionSummaryCards } from "./AuditExecutionSummaryCards";
import { AuditExecutionTable } from "./AuditExecutionTable";
import { AuditExecutionMobileCards } from "./AuditExecutionMobileCards";

export function AuditExecutionDashboardPage() {
  const query = useAuditExecutionDashboard();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title="Audit Execution Dashboard" subtitle="Live execution status, pending evidence, field findings, readiness, and recent execution activity." actionHref="/audit-compliance/execution/start-from-plan" />
        <AuditExecutionSummaryCards summary={query.data.summary} />
        <div className="grid gap-5 xl:grid-cols-3">
          <AuditCard title="Status breakdown"><Chart rows={query.data.byStatus} /></AuditCard>
          <AuditCard title="Progress breakdown"><Chart rows={query.data.byProgress} /></AuditCard>
          <AuditCard title="Evidence status"><Chart rows={query.data.byEvidence} /></AuditCard>
        </div>
        <AuditCard title="Recent executions"><AuditExecutionTable rows={query.data.recent} /><AuditExecutionMobileCards rows={query.data.recent} /></AuditCard>
      </div>
    </AuditLayout>
  );
}

function Chart({ rows }: { rows: { label: string; value: number }[] }) {
  const total = rows.reduce((sum, row) => sum + Number(row.value), 0) || 1;
  return <div className="space-y-3">{rows.length ? rows.map((row) => <div key={row.label}><div className="mb-1 flex justify-between text-sm"><span className="text-[var(--psm-fg)]">{row.label}</span><span className="font-semibold">{row.value}</span></div><div className="h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(4, (row.value / total) * 100)}%` }} /></div></div>) : <p className="text-sm text-[var(--psm-muted)]">No backend rows available for this breakdown.</p>}</div>;
}
