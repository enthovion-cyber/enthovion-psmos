import { AuditCard, AuditMetricCard } from "../../shared/AuditUi";
import { AuditEvidenceStatusBadge } from "../../shared/AuditEvidenceStatusBadge";
import { AuditExecutionStatusBadge } from "../../shared/AuditExecutionStatusBadge";
import type { AuditExecutionDetail } from "../../types/audit-execution.types";

export function ExecutionOverviewTab({ detail }: { detail: AuditExecutionDetail }) {
  const readiness = detail.readiness;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <AuditMetricCard label="Progress" value={`${detail.execution.progress_percent ?? 0}%`} tone="info" />
        <AuditMetricCard label="Total items" value={detail.items.length} />
        <AuditMetricCard label="Responses" value={detail.responses.length} tone={detail.responses.length ? "good" : "neutral"} />
        <AuditMetricCard label="Evidence links" value={detail.evidence.length} tone={detail.execution.evidence_missing_count ? "danger" : "good"} />
        <AuditMetricCard label="Field findings" value={detail.findings.length} tone={detail.execution.critical_findings_count ? "danger" : "warn"} />
        <AuditMetricCard label="Readiness" value={readiness?.readiness_status ?? "Not checked"} tone={readiness?.ready_for_completion ? "good" : "warn"} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <AuditCard title="Execution Snapshot"><div className="grid gap-3 text-sm md:grid-cols-2"><Fact label="Status" value={<AuditExecutionStatusBadge status={detail.execution.execution_status} />} /><Fact label="Mode" value={detail.execution.execution_mode} /><Fact label="Audit type" value={detail.execution.audit_type ?? "Not set"} /><Fact label="Criticality" value={detail.execution.criticality ?? "Not set"} /><Fact label="Evidence" value={<AuditEvidenceStatusBadge status={detail.execution.evidence_status} />} /><Fact label="Ready for finding register" value={detail.execution.ready_for_finding_register ? "Yes" : "No"} /></div></AuditCard>
        <AuditCard title="Readiness / Blockers">{readiness?.missing_items_json?.length ? <ul className="space-y-2 text-sm text-danger">{readiness.missing_items_json.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="text-sm text-[var(--psm-muted)]">No backend readiness blockers returned.</p>}{readiness?.warnings_json?.length ? <ul className="mt-3 space-y-2 text-sm text-amber-700">{readiness.warnings_json.map((item) => <li key={item}>{item}</li>)}</ul> : null}</AuditCard>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-3"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--psm-muted)]">{label}</p><div className="mt-2 font-semibold text-[var(--psm-fg)]">{value}</div></div>;
}
