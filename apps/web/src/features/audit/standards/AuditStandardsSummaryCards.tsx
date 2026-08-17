import { AuditMetricCard } from "../shared/AuditUi";

export function AuditStandardsSummaryCards({ summary }: { summary?: Record<string, any> }) {
  const data = summary ?? {};
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <AuditMetricCard label="Total mappings" value={data.totalMappings ?? 0} tone="info" />
    <AuditMetricCard label="Verified" value={data.verified ?? 0} tone="good" />
    <AuditMetricCard label="Open gaps" value={data.openGaps ?? 0} tone={(data.openGaps ?? 0) > 0 ? "danger" : "good"} />
    <AuditMetricCard label="Evidence missing" value={data.evidenceMissing ?? 0} tone={(data.evidenceMissing ?? 0) > 0 ? "warn" : "good"} />
    <AuditMetricCard label="Stale mappings" value={data.stale ?? 0} tone={(data.stale ?? 0) > 0 ? "warn" : "good"} />
    <AuditMetricCard label="Report ready" value={data.reportReady ?? 0} tone="good" />
    <AuditMetricCard label="CAPA overdue" value={data.capaOverdue ?? 0} tone={(data.capaOverdue ?? 0) > 0 ? "danger" : "neutral"} />
    <AuditMetricCard label="Pending review" value={data.pendingReview ?? 0} tone="warn" />
  </div>;
}
