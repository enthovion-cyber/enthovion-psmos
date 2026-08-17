"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditButton, AuditCard, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { useAuditFindingDashboard } from "../hooks/useAuditFindingDashboard";
import { AuditFindingSummaryCards } from "./AuditFindingSummaryCards";
import { AuditFindingTable } from "./AuditFindingTable";
import { AuditFindingMobileCards } from "./AuditFindingMobileCards";

function Breakdown({ title, rows }: { title: string; rows: { key: string; label: string; count: number }[] }) {
  return (
    <AuditCard title={title}>
      {rows.length ? <div className="space-y-3">{rows.map((row) => <div key={row.key} className="flex items-center justify-between gap-3"><span className="text-sm text-[var(--psm-muted)]">{row.label}</span><span className="font-semibold text-[var(--psm-fg)]">{row.count}</span></div>)}</div> : <AuditEmptyState title="No data" message="No backend finding rows are available for this breakdown." />}
    </AuditCard>
  );
}

export function AuditFindingDashboardPage() {
  const query = useAuditFindingDashboard();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const data = query.data;
  return (
    <AuditLayout>
      <div className="space-y-5">
        <AuditHeader title="Audit Finding Dashboard" subtitle="Formal audit finding status, severity, CAPA readiness, duplicate/repeat warnings, overdue items, and critical attention from backend aggregation only." actionHref="/audit-compliance/findings/new" />
        <AuditFindingSummaryCards summary={data.summary} />
        <div className="grid gap-4 xl:grid-cols-3">
          <Breakdown title="Findings by status" rows={data.byStatus} />
          <Breakdown title="Findings by severity" rows={data.bySeverity} />
          <Breakdown title="Findings by module" rows={data.byModule} />
        </div>
        <AuditCard title="Critical attention" subtitle="Safety-critical, regulatory-critical, PSM-critical, overdue, repeat, awaiting-owner, and ready-for-CAPA queues." action={<AuditButton href="/audit-compliance/findings/register" variant="secondary">Open register</AuditButton>}>
          {data.safetyCritical.length || data.overdue.length || data.awaitingOwner.length ? (
            <div className="grid gap-4 xl:grid-cols-3">
              <div><h3 className="mb-2 font-semibold text-[var(--psm-fg)]">Safety critical</h3><AuditFindingMobileCards rows={data.safetyCritical.slice(0, 4)} /></div>
              <div><h3 className="mb-2 font-semibold text-[var(--psm-fg)]">Overdue</h3><AuditFindingMobileCards rows={data.overdue.slice(0, 4)} /></div>
              <div><h3 className="mb-2 font-semibold text-[var(--psm-fg)]">Awaiting owner</h3><AuditFindingMobileCards rows={data.awaitingOwner.slice(0, 4)} /></div>
            </div>
          ) : <AuditEmptyState title="No critical attention findings" message="The backend did not return safety-critical, overdue, or awaiting-owner findings for the active scope." />}
        </AuditCard>
        <AuditCard title="Recent conversions and formal findings">
          {data.recent.length ? <><AuditFindingTable rows={data.recent} /><AuditFindingMobileCards rows={data.recent} /></> : <AuditEmptyState title="No recent findings" message="Create a manual finding or convert an audit execution field finding to populate this dashboard." action={<AuditButton href="/audit-compliance/findings/new">Create finding</AuditButton>} />}
        </AuditCard>
      </div>
    </AuditLayout>
  );
}
