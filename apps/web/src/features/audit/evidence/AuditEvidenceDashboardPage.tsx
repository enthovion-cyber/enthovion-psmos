"use client";
import { AuditHeader } from "../AuditHeader";
import { AuditLayout } from "../AuditLayout";
import { AuditCard, AuditButton, AuditEmptyState, AuditErrorState, AuditLoadingState } from "../shared/AuditUi";
import { AuditEvidenceSummaryCards } from "./AuditEvidenceSummaryCards";
import { AuditEvidenceTable } from "./AuditEvidenceTable";
import { useAuditEvidenceDashboard } from "../hooks/useAuditEvidenceDashboard";

export function AuditEvidenceDashboardPage() {
  const query = useAuditEvidenceDashboard();
  if (query.isLoading) return <AuditLayout><AuditLoadingState /></AuditLayout>;
  if (query.error || !query.data) return <AuditLayout><AuditErrorState message={query.error} onRetry={() => query.refetch()} /></AuditLayout>;
  const data = query.data;
  return <AuditLayout><div className="space-y-5">
    <AuditHeader title="Audit Evidence Collection Dashboard" subtitle="Evidence requirements, requests, gaps, review queues, restricted access, and package readiness from backend records." actionHref="/audit-compliance/evidence/new" />
    <AuditEvidenceSummaryCards summary={data.summary} />
    <div className="grid gap-5 xl:grid-cols-3">
      <AuditCard title="Critical evidence attention" subtitle="Missing, rejected, rework, restricted, and overdue evidence conditions.">
        <div className="grid grid-cols-2 gap-3 text-sm"><Stat label="Missing" value={data.missing.length} /><Stat label="Pending review" value={data.pendingReview.length} /><Stat label="Rejected" value={data.rejected.length} /><Stat label="Restricted" value={data.restricted.length} /><Stat label="Due soon" value={data.requestsDueSoon.length} /><Stat label="Overdue" value={data.requestsOverdue.length} /></div>
      </AuditCard>
      <AuditCard title="Source-module coverage"><Bars rows={data.bySourceModule} /></AuditCard>
      <AuditCard title="Document and upload foundation"><Bars rows={data.byDocumentType} /></AuditCard>
    </div>
    <AuditCard title="Recent evidence" action={<AuditButton href="/audit-compliance/evidence/register" variant="secondary">Open Register</AuditButton>}>{data.recent.length ? <AuditEvidenceTable rows={data.recent} /> : <AuditEmptyState title="No evidence collected yet" message="Create a requirement or collect evidence to begin the controlled chain of custody." action={<AuditButton href="/audit-compliance/evidence/new">Collect Evidence</AuditButton>} />}</AuditCard>
  </div></AuditLayout>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-[var(--psm-muted)]">{label}</p><b className="text-xl">{value}</b></div>; }
function Bars({ rows }: { rows: Record<string, any>[] }) { if (!rows.length) return <AuditEmptyState title="No grouped data" message="Backend returned no records for this breakdown." />; const max = Math.max(...rows.map((r) => Number(r.count ?? 0)), 1); return <div className="space-y-3">{rows.slice(0, 8).map((row) => <div key={row.key}><div className="mb-1 flex justify-between text-sm"><span>{row.label}</span><b>{row.count}</b></div><div className="h-2 rounded-full bg-[var(--psm-surface-3)]"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(5, (Number(row.count) / max) * 100)}%` }} /></div></div>)}</div>; }
