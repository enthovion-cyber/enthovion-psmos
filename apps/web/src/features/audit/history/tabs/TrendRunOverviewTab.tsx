import { AuditCard } from '../../shared/AuditUi';
import { AuditMetricCard } from '../../shared/AuditUi';
import type { AuditTrendRunDetail } from '../../types/audit-trend.types';
import { AuditTrendMetricChart } from '../AuditMetricChart';
import { AuditTrendResultCard } from '../AuditTrendResultCard';
import { AuditTrendStaleWarningPanel } from '../AuditTrendStaleWarningPanel';

export function TrendRunOverviewTab({ detail }: { detail: AuditTrendRunDetail }) {
  return <div className="space-y-5"><AuditTrendStaleWarningPanel run={detail.trendRun} staleness={detail.staleness} /><div className="grid gap-3 md:grid-cols-4"><AuditMetricCard label="Results" value={detail.results.length} tone="info" /><AuditMetricCard label="Source Records" value={detail.sourceRecords.length} tone="neutral" /><AuditMetricCard label="Metric Points" value={detail.metrics.length} tone="neutral" /><AuditMetricCard label="History Events" value={detail.history.length} tone="neutral" /></div><div className="grid gap-5 xl:grid-cols-[1fr_.8fr]"><AuditCard title="Top Trend Results"><div className="space-y-3">{detail.results.slice(0, 4).map((result) => <AuditTrendResultCard key={result.id} result={result} />)}</div></AuditCard><AuditCard title="Metric Points"><AuditTrendMetricChart title="trend metrics" rows={detail.metrics} labelKey="metric_label" valueKey="value" /></AuditCard></div></div>;
}
