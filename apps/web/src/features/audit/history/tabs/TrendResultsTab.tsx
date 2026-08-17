import { AuditEmptyState } from '../../shared/AuditUi';
import type { AuditTrendResult } from '../../types/audit-trend.types';
import { AuditTrendResultCard } from '../AuditTrendResultCard';

export function TrendResultsTab({ results }: { results: AuditTrendResult[] }) {
  return results.length ? <div className="grid gap-3 md:grid-cols-2">{results.map((result) => <AuditTrendResultCard key={result.id} result={result} />)}</div> : <AuditEmptyState title="No trend results" message="The backend did not create trend results for this run. Check source data, permissions, and readiness." />;
}
