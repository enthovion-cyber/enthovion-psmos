import { AuditCard, AuditMetricCard } from "../../shared/AuditUi";
import { AuditMappingHealthBadge } from "../../components/shared/AuditMappingHealthBadge";
export function MappingCoverageTab({ detail }: { detail: Record<string, any> }) {
  const coverage = detail.coverage ?? {};
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-4"><AuditMetricCard label="Evidence" value={coverage.evidenceCount ?? 0} /><AuditMetricCard label="Findings" value={coverage.findingCount ?? 0} /><AuditMetricCard label="CAPA overdue" value={coverage.overdueCapaCount ?? 0} tone={(coverage.overdueCapaCount ?? 0) ? "danger" : "neutral"} /><AuditMetricCard label="Health" value={<AuditMappingHealthBadge value={coverage.healthStatus} />} /></div><AuditCard title="Coverage calculation"><pre className="overflow-auto rounded-lg bg-[var(--psm-surface-2)] p-3 text-xs">{JSON.stringify(coverage, null, 2)}</pre></AuditCard></div>;
}
