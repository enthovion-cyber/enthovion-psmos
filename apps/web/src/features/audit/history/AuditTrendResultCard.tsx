import { AuditTrendConfidenceBadge } from '../shared/AuditTrendConfidenceBadge';
import { AuditTrendDirectionBadge } from '../shared/AuditTrendDirectionBadge';
import type { AuditTrendResult } from '../types/audit-trend.types';

export function AuditTrendResultCard({ result }: { result: AuditTrendResult }) {
  return <article className="rounded-xl border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold text-[var(--psm-fg)]">{result.result_title}</h3><p className="text-sm text-[var(--psm-muted)]">{result.result_category} | {result.source_count} source records</p></div><div className="flex gap-2"><AuditTrendDirectionBadge value={result.trend_direction} /><AuditTrendConfidenceBadge value={result.confidence} /></div></div>{result.recommended_follow_up ? <p className="mt-3 rounded-lg bg-[var(--psm-surface)] p-3 text-sm text-[var(--psm-muted)]">{result.recommended_follow_up}</p> : null}</article>;
}
