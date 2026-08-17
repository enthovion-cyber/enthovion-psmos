import { AuditMetricCard } from "../shared/AuditUi";
import type { AuditExecutionSummary } from "../types/audit-execution.types";

export function AuditExecutionSummaryCards({ summary }: { summary: AuditExecutionSummary }) {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      <AuditMetricCard label="Total executions" value={summary.total ?? 0} tone="info" />
      <AuditMetricCard label="In progress" value={summary.inProgress ?? 0} tone="good" />
      <AuditMetricCard label="Pending responses" value={summary.pendingResponses ?? 0} tone={summary.pendingResponses ? "warn" : "neutral"} />
      <AuditMetricCard label="Pending evidence" value={summary.pendingEvidence ?? 0} tone={summary.pendingEvidence ? "danger" : "neutral"} />
      <AuditMetricCard label="Field findings" value={summary.fieldFindings ?? 0} tone={summary.criticalFindings ? "danger" : "info"} />
    </div>
  );
}
