import Link from 'next/link';
import type { ExecutiveKpiResult } from '../types/executive-kpi.types';
import { ExecutiveStatusBadge } from './shared/ExecutiveStatusBadge';

export function ExecutiveKpiCard({ result }: { result: ExecutiveKpiResult }) {
  return <Link href={result.drilldownRoute ?? `/executive/kpis/${result.definitionId}`} className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface)] p-4 transition hover:border-[var(--psm-primary)] hover:shadow-sm"><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium text-[var(--psm-muted)]">{result.title}</p><ExecutiveStatusBadge status={result.status} /></div><p className="mt-3 text-2xl font-bold text-[var(--psm-text)]">{String(result.displayValue ?? result.value ?? 'Insufficient Data')}</p><div className="mt-2 space-y-1 text-xs text-[var(--psm-muted)]"><p>{result.sourceModule} · {result.thresholdStatus}</p><p>{result.sourceCount} source records · {new Date(result.calculatedAt).toLocaleString()}</p><p>{result.trendStatus} · {result.confidenceStatus}</p></div></Link>;
}
